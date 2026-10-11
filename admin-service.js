/**
 * Admin Service - مكتبة خدمات وإدارة المشرفين سحابياً
 */

class AdminService {
    constructor(dbInstance) {
        this.db = dbInstance;
        this.collectionName = 'admins';
    }

    // جلب كل المشرفين
    async getAllAdmins() {
        try {
            const snapshot = await this.db.collection(this.collectionName).get();
            let admins = [];
            snapshot.forEach(doc => {
                admins.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: admins };
        } catch (error) {
            console.error("خطأ في جلب المشرفين:", error);
            return { success: false, error: error.message };
        }
    }

    // جلب مشرف معين بواسطة الـ ID أو الإيميل
    async getAdminById(adminId) {
        try {
            const doc = await this.db.collection(this.collectionName).doc(adminId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: "المشرف غير موجود" };
            }
        } catch (error) {
            console.error("خطأ في جلب بيانات المشرف:", error);
            return { success: false, error: error.message };
        }
    }

    // إضافة مشرف جديد
    async createAdmin(adminData) {
        try {
            const docId = (adminData.username || adminData.email).toLowerCase().trim();
            await this.db.collection(this.collectionName).doc(docId).set({
                name: adminData.name,
                username: adminData.username,
                email: adminData.email || adminData.username,
                password: adminData.password,
                phone: adminData.phone || '',
                role: adminData.role || 'moderator',
                isVerified: adminData.isVerified || false,
                verified: adminData.isVerified || false,
                createdAt: Date.now()
            });
            return { success: true, message: "تم إضافة المشرف بنجاح" };
        } catch (error) {
            console.error("خطأ في إضافة المشرف:", error);
            return { success: false, error: error.message };
        }
    }

    // تحديث بيانات مشرف
    async updateAdmin(adminId, updateData) {
        try {
            await this.db.collection(this.collectionName).doc(adminId).update(updateData);
            return { success: true, message: "تم تحديث بيانات المشرف بنجاح" };
        } catch (error) {
            console.error("خطأ في تحديث المشرف:", error);
            return { success: false, error: error.message };
        }
    }

    // حذف مشرف
    async deleteAdmin(adminId) {
        try {
            await this.db.collection(this.collectionName).doc(adminId).delete();
            return { success: true, message: "تم حذف المشرف بنجاح" };
        } catch (error) {
            console.error("خطأ في حذف المشرف:", error);
            return { success: false, error: error.message };
        }
    }
}
