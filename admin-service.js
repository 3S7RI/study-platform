// admin-service.js - ملف الخدمات الشامل والموحد لإدارة وتخزين وإنشاء وتعديل بيانات مشرفي المنصة
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة المشرف بدقة تامة باستخدام الـ Document ID أو الإيميل
 */
export async function findAdminDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim();
    const lowerId = cleanId.toLowerCase();

    try {
        // البحث المباشر بمعرف المستند (Document ID) كما هو
        let docRef = doc(db, "admins", cleanId);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'admins' };

        // البحث بمعرف المستند بالحروف الصغيرة
        let lowerDocRef = doc(db, "admins", lowerId);
        let lowerDocSnap = await getDoc(lowerDocRef);
        if (lowerDocSnap.exists()) return { id: lowerDocSnap.id, ref: lowerDocRef, data: lowerDocSnap.data(), collectionName: 'admins' };

        // البحث بواسطة حقل email
        let q = query(collection(db, "admins"), where("email", "==", lowerId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة حقل username
        q = query(collection(db, "admins"), where("username", "==", lowerId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة حقل adminId
        q = query(collection(db, "admins"), where("adminId", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

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
 * 3. إنشاء مشرف جديد رسمياً
 */
export async function createAdminAccount(db, adminIdentifier, adminData = {}) {
    try {
        const cleanId = String(adminIdentifier).toLowerCase().trim();
        const docRef = doc(db, "admins", cleanId);
        
        const isVerifiedStatus = adminData.isVerified === true || adminData.verified === true;

        const newAdminData = {
            adminId: adminData.adminId || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
            name: adminData.name || adminData.fullname || 'مشرف المنصة',
            fullname: adminData.name || adminData.fullname || 'مشرف المنصة',
            username: adminData.username || cleanId,
            email: adminData.email || cleanId,
            password: adminData.password || '',
            phone: adminData.phone || '',
            role: adminData.role || 'moderator', 
            isVerified: isVerifiedStatus,
            verified: isVerifiedStatus,
            profileImage: adminData.profileImage || adminData.avatar || '',
            avatar: adminData.profileImage || adminData.avatar || '',
            createdAt: String(Date.now())
        };

        await setDoc(docRef, newAdminData);
        console.log("تم إنشاء حساب المشرف رسمياً في السحابة:", cleanId);
        return { id: cleanId, ref: docRef, data: newAdminData, collectionName: 'admins' };
    } catch (e) {
        console.error("خطأ في إنشاء حساب المشرف:", e);
        return null;
    }
}

/**
 * 4. تعديل وتحديث بيانات المشرف (معالجة مباشرة لـ Document ID)
 */
export async function updateAdminData(db, adminIdentifier, updateFields = {}) {
    try {
        let targetRef = null;
        
        // المحاولة المباشرة باستخدام المعرف كـ Document ID في مجموعة admins
        if (adminIdentifier) {
            let directRef = doc(db, "admins", String(adminIdentifier).trim());
            let directSnap = await getDoc(directRef);
            if (directSnap.exists()) {
                targetRef = directRef;
            }
        }

        // لو لم يتم العثور عليه مباشرة، نستخدم دالة البحث الشامل
        if (!targetRef) {
            let adminObj = await findAdminDocument(db, adminIdentifier);
            if (!adminObj) {
                console.warn("محاولة تحديث بيانات مشرف غير موجود:", adminIdentifier);
                return false;
            }
            targetRef = adminObj.ref;
        }

        // مزامنة حالة التوثيق
        if (updateFields.isVerified !== undefined || updateFields.verified !== undefined) {
            let verifyVal = updateFields.isVerified === true || updateFields.verified === true;
            updateFields.isVerified = verifyVal;
            updateFields.verified = verifyVal;
        }

        // مزامنة الاسم
        if (updateFields.name && !updateFields.fullname) {
            updateFields.fullname = updateFields.name;
        } else if (updateFields.fullname && !updateFields.name) {
            updateFields.name = updateFields.fullname;
        }

        const payload = {
            ...updateFields,
            lastUpdated: String(Date.now())
        };

        await updateDoc(targetRef, payload);
        console.log("تم تحديث بيانات المشرف بنجاح!");
        return true;
    } catch (e) {
        console.error("خطأ في تحديث بيانات المشرف:", e);
        return false;
    }
}

/**
 * 5. حذف حساب المشرف نهائياً من السحابة
 */
export async function deleteAdminAdminAccount(db, adminIdentifier) {
    try {
        let targetRef = null;
        if (adminIdentifier) {
            let directRef = doc(db, "admins", String(adminIdentifier).trim());
            let directSnap = await getDoc(directRef);
            if (directSnap.exists()) {
                targetRef = directRef;
            }
        }

        if (!targetRef) {
            let adminObj = await findAdminDocument(db, adminIdentifier);
            if (!adminObj) return false;
            targetRef = adminObj.ref;
        }

        await deleteDoc(targetRef);
        console.log("تم حذف حساب المشرف بنجاح من السحابة.");
        return true;
    } catch (e) {
        console.error("خطأ في حذف حساب المشرف:", e);
        return false;
    }
}

export const deleteAdminAccount = deleteAdminAdminAccount;
