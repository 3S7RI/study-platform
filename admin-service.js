// admin-service.js - ملف الخدمات الشامل والموحد لإدارة المشرفين داخل مجموعة users (Firebase Modular SDK)
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة المشرف بدقة داخل مجموعة users باستخدام الإيميل، الـ AdminId، أو الـ UID
 */
export async function findAdminDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        // البحث المباشر بمعرف المستند (الإيميل) مع التحقق من الرول
        let docRef = doc(db, "users", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === 'admin') {
            return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'users' };
        }

        // البحث بواسطة حقل email
        let q = query(collection(db, "users"), where("email", "==", cleanId), where("role", "==", "admin"));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

        // البحث بواسطة adminId
        q = query(collection(db, "users"), where("adminId", "==", identifier), where("role", "==", "admin"));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

        // البحث بواسطة uid
        q = query(collection(db, "users"), where("uid", "==", identifier), where("role", "==", "admin"));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'users' };

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
        const docRef = doc(db, "users", cleanId);
        
        const newAdminData = {
            role: 'admin',
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
        return { id: cleanId, ref: docRef, data: newAdminData, collectionName: 'users' };
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
