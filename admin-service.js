// admin-service.js - ملف الخدمات الشامل والموحد لإدارة المشرفين (متوافق تماماً مع Firebase Compat)

/**
 * 1. البحث عن وثيقة المشرف بدقة تامة باستخدام الـ Document ID أو الإيميل
 */
export async function findAdminDocument(db, identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim();
    const lowerId = cleanId.toLowerCase();

    try {
        // البحث المباشر بمعرف المستند (Document ID) كما هو
        let docRef = db.collection("admins").doc(cleanId);
        let docSnap = await docRef.get();
        if (docSnap.exists) return { id: docSnap.id, ref: docRef, data: docSnap.data(), collectionName: 'admins' };

        // البحث بمعرف المستند بالحروف الصغيرة
        let lowerDocRef = db.collection("admins").doc(lowerId);
        let lowerDocSnap = await lowerDocRef.get();
        if (lowerDocSnap.exists) return { id: lowerDocSnap.id, ref: lowerDocRef, data: lowerDocSnap.data(), collectionName: 'admins' };

        // البحث بواسطة حقل email
        let snapEmail = await db.collection("admins").where("email", "==", lowerId).get();
        if (!snapEmail.empty) return { id: snapEmail.docs[0].id, ref: snapEmail.docs[0].ref, data: snapEmail.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة حقل username
        let snapUsername = await db.collection("admins").where("username", "==", lowerId).get();
        if (!snapUsername.empty) return { id: snapUsername.docs[0].id, ref: snapUsername.docs[0].ref, data: snapUsername.docs[0].data(), collectionName: 'admins' };

        // البحث بواسطة حقل adminId
        let snapAdminId = await db.collection("admins").where("adminId", "==", cleanId).get();
        if (!snapAdminId.empty) return { id: snapAdminId.docs[0].id, ref: snapAdminId.docs[0].ref, data: snapAdminId.docs[0].data(), collectionName: 'admins' };

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
        const docRef = db.collection("admins").doc(cleanId);
        
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

        await docRef.set(newAdminData);
        console.log("تم إنشاء حساب المشرف رسمياً في السحابة:", cleanId);
        return { id: cleanId, ref: docRef, data: newAdminData, collectionName: 'admins' };
    } catch (e) {
        console.error("خطأ في إنشاء حساب المشرف:", e);
        return null;
    }
}

/**
 * 4. تعديل وتحديث بيانات المشرف (تم إصلاحها لتستخدم طريقة Compat المباشرة للـ Document ID)
 */
export async function updateAdminData(db, adminIdentifier, updateFields = {}) {
    try {
        let targetRef = null;
        
        // المحاولة المباشرة باستخدام المعرف كـ Document ID في مجموعة admins
        if (adminIdentifier) {
            let directRef = db.collection("admins").doc(String(adminIdentifier).trim());
            let directSnap = await directRef.get();
            if (directSnap.exists) {
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

        await targetRef.update(payload);
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
            let directRef = db.collection("admins").doc(String(adminIdentifier).trim());
            let directSnap = await directRef.get();
            if (directSnap.exists) {
                targetRef = directRef;
            }
        }

        if (!targetRef) {
            let adminObj = await findAdminDocument(db, adminIdentifier);
            if (!adminObj) return false;
            targetRef = adminObj.ref;
        }

        await targetRef.delete();
        console.log("تم حذف حساب المشرف بنجاح من السحابة.");
        return true;
    } catch (e) {
        console.error("خطأ في حذف حساب المشرف:", e);
        return false;
    }
}

export const deleteAdminAccount = deleteAdminAdminAccount;
