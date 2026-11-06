# إعداد إشعارات الموبايل (مرة واحدة)

1. **Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair**، انسخ المفتاح العام.
2. **Firebase Console → Project settings → Service accounts → Generate new private key** (بينزّل ملف JSON).
3. **Cloudflare → Workers → Create** باسم `studytrip-push`، والصق محتوى `push-worker.js`.
4. في Settings → Variables → **Secrets**: أضف `FCM_SA` والصق فيه محتوى ملف الـ JSON كامل.
5. (اختياري، تذكير يومي) Settings → Triggers → Cron: `0 15 * * *` وأضف متغير عادي `DAILY_REMINDER = 1`.
6. افتح `admin-push.html`: الصق مفتاح VAPID ورابط الـ Worker واضغط حفظ.
7. افتح `main.html` من موبايل، اضغط «فعّل» في شريط التنبيهات، وبعدها جرّب «تجربة على جهازي بس».

ملاحظات:
- آيفون: الإشعارات بتشتغل بس لو الطالب ضاف المنصة للشاشة الرئيسية (iOS 16.4+).
- الإشعارات محتاجة نت أصلاً. التطبيق نفسه بيفتح بالنت بس (الـ Service Worker شبكة فقط، مفيش أي صفحة بتتخزن).
