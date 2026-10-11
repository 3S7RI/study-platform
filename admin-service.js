// admin-service.js - ملف الخدمات الشامل والموحد لإدارة وتخزين وإنشاء وتعديل بيانات مشرفي المنصة
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * 1. البحث عن وثيقة المشرف في قاعدة البيانات بأي وسيلة (Document ID, Email, Username, أو adminId)
 */
export async function findAdminDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).toLowerCase().trim();

    try {
        // البحث المباشر بواسطة معرف المستند (Document ID)
        let docRef = doc(db, "admins", identifier);
        let docSnap = await getDoc(docRef);
        if (docSnap.exists()) return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'admins' };

        // البحث بالمستند بالاسم المحول لصيغة نظيفة
        let cleanDocRef = doc(db, "admins", cleanId);
        let cleanDocSnap = await getDoc(cleanDocRef);
        if (cleanDocSnap.exists()) return { id: cleanDocSnap.id, ref: cleanDocRef, data: cleanDocSnap.data(), collectionName: 'admins' };

        // البحث بواسطة email
        let q = query(collection(db, "admins"), where("email", "==", cleanId));
        let snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة username
        q = query(collection(db, "admins"), where("username", "==", cleanId));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة adminId (مثل ADM-xxxx)
        q = query(collection(db, "admins"), where("adminId", "==", identifier));
        snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ref: snap.docs[0].ref, data: snap.docs[0].data(), collectionName: 'admins' };

        return null;
    } catch (e) {
        console.error("خطأ أثناء البحث عن المشرف:", e);
        return null;
    }
}

/**
 * 2. جلب بيانات المشرف فقط
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
            createdAt: Date.now()
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
 * 4. تعديل وتحديث بيانات المشرف الموجود فعلياً
 */
export async function updateAdminData(db, adminIdentifier, updateFields = {}) {
    try {
        let adminObj = await findAdminDocument(db, adminIdentifier);
        if (!adminObj) {
            console.warn("محاولة تحديث بيانات مشرف غير موجود:", adminIdentifier);
            return false;
        }

        // مزامنة حالة التوثيق لضمان تطابق الحقلين معاً
        if (updateFields.isVerified !== undefined || updateFields.verified !== undefined) {
            let verifyVal = updateFields.isVerified === true || updateFields.verified === true;
            updateFields.isVerified = verifyVal;
            updateFields.verified = verifyVal;
        }

        // مزامنة الاسم لضمان حفظه في الحقلين معاً (name و fullname)
        if (updateFields.name && !updateFields.fullname) {
            updateFields.fullname = updateFields.name;
        } else if (updateFields.fullname && !updateFields.name) {
            updateFields.name = updateFields.fullname;
        }

        const payload = {
            ...updateFields,
            lastUpdated: Date.now()
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
 * 5. حذف حساب المشرف نهائياً من السحابة (تم تصحيح طريقة الحذف بـ deleteDoc)
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
