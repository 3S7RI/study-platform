// admin-service.js - ملف الخدمات الشامل والموحد لإدارة المشرفين داخل مجموعة admins (Firebase Modular SDK)
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة المشرف بدقة داخل مجموعة users باستخدام الإيميل، الـ AdminId، أو الـ UID
 */
export async function findAdminDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();
    const rawId = String(identifier).trim();
    const pack = (snap, coll) => ({ id: snap.id, ref: snap.ref, data: snap.data(), collectionName: coll });

    try {
        // مجموعة admins هي المصدر الأساسي (نفس اللي بيستخدمه login و admin-index و admin-users)
        let snap = await getDoc(doc(db, "admins", cleanId));
        if (snap.exists()) return pack(snap, 'admins');
        if (rawId !== cleanId) { snap = await getDoc(doc(db, "admins", rawId)); if (snap.exists()) return pack(snap, 'admins'); }

        for (const [field, val] of [["email", cleanId], ["adminId", rawId], ["uid", rawId]]) {
            const q = await getDocs(query(collection(db, "admins"), where(field, "==", val)));
            if (!q.empty) return pack(q.docs[0], 'admins');
        }

        // توافق مع البيانات القديمة في users
        snap = await getDoc(doc(db, "users", cleanId));
        if (snap.exists() && snap.data().role === 'admin') return pack(snap, 'users');
        const q = await getDocs(query(collection(db, "users"), where("email", "==", cleanId), where("role", "==", "admin")));
        if (!q.empty) return pack(q.docs[0], 'users');

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن المشرف:", e);
        return null;
    }
}

/**
 * 2. جلب بيانات المشرف
 */
export async function getAdminData(db, adminIdentifier) {
    let adminObj = await findAdminDocument(db, adminIdentifier);
    if (adminObj) {
        return adminObj; 
    }
    return null; 
}

/**
 * 3. إنشاء مشرف جديد رسمياً بالحقول الموحدة النظيفة داخل مجموعة users
 */
export async function createAdminAccount(db, adminIdentifier, adminData = {}) {
    try {
        const cleanId = String(adminIdentifier).toLowerCase().trim();
        const docRef = doc(db, "admins", cleanId);
        
        const newAdminData = {
            role: adminData.role || adminData.adminLevel || 'moderator',
            adminId: adminData.adminId || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
            adminLevel: adminData.adminLevel || 'moderator',
            uid: adminData.uid || '',
            name: adminData.name || adminData.fullname || 'مشرف المنصة',
            email: cleanId.includes('@') ? cleanId : (adminData.email || ''),
            phone: adminData.phone || '',
            status: 'active',
            isVerified: adminData.isVerified === true || adminData.verified === true,
            profileImage: adminData.profileImage || adminData.avatar || '',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        await setDoc(docRef, newAdminData);
        console.log("تم إنشاء حساب المشرف رسمياً في مجموعة users:", cleanId);
        return { id: cleanId, ref: docRef, data: newAdminData, collectionName: 'admins' };
    } catch (e) {
        console.error("خطأ في إنشاء حساب المشرف:", e);
        return null;
    }
}

/**
 * 4. تعديل وتحديث بيانات المشرف الموجود فعلياً
 */
export async function updateAdminData(db, adminIdentifier, updateFields = {}) {
    try {
        let adminObj = await findAdminDocument(db, adminIdentifier);
        if (!adminObj) {
            console.warn("محاولة تحديث بيانات مشرف غير موجود:", adminIdentifier);
            return false;
        }

        const payload = {
            ...updateFields,
            lastUpdated: new Date().toISOString()
        };

        await updateDoc(adminObj.ref, payload);
        console.log("تم تحديث بيانات المشرف بنجاح!");
        return true;
    } catch (e) {
        console.error("خطأ في تحديث بيانات المشرف:", e);
        return false;
    }
}

/**
 * 5. حذف حساب المشرف نهائياً من مجموعة users
 */
export async function deleteAdminAccount(db, adminIdentifier) {
    try {
        let adminObj = await findAdminDocument(db, adminIdentifier);
        if (!adminObj) return false;

        await deleteDoc(adminObj.ref);
        console.log("تم حذف حساب المشرف بنجاح من السحابة.");
        return true;
    } catch (e) {
        console.error("خطأ في حذف حساب المشرف:", e);
        return false;
    }
}

export const deleteAdminAdminAccount = deleteAdminAccount;


/**
 * سجل عمليات الأدمن (adminLogs): مين عمل إيه ومتى. بيفشل بصمت ومبيعطّلش العملية الأصلية.
 */
export async function logAdminAction(db, actor, action, target = '', details = '') {
    try {
        await addDoc(collection(db, "adminLogs"), {
            actor: String(actor || 'admin').slice(0, 100),
            action: String(action || '').slice(0, 60),
            target: String(target || '').slice(0, 120),
            details: String(details || '').slice(0, 300),
            t: new Date().toISOString(),
            createdAt: serverTimestamp()
        });
    } catch (e) { console.warn('adminLogs:', e && e.message); }
}
