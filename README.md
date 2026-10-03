# همیار وام — نسخه آزمایشی (پروتوتایپ)

نسخه قابل کلیک طراحی «همیار وام»: ۱۴ صفحه اپ متقاضی (موبایل)، ۴ صفحه پنل کارشناس و برگه اجزا.
سایت کاملاً ایستا است و به هیچ سرویس بیرونی وابسته نیست (فونت وزیرمتن و کتابخانه‌ها داخل همین پوشه‌اند)، پس روی GitHub Pages، Netlify، Vercel یا هر هاست ساده‌ای بالا می‌آید.

> اسم‌ها، پرونده‌ها و اعداد نمونه‌اند و به هیچ بانک یا سامانه‌ای وصل نیست.

## آنلاین کردن روی GitHub Pages

1. در GitHub یک مخزن (repository) تازه بسازید، مثلاً `hamyar-vam-prototype`.
   اگر حساب رایگان دارید، مخزن باید **Public** باشد تا Pages فعال شود.
2. همه محتوای این پوشه را (خود فایل‌ها، نه پوشه بالایی) آپلود کنید:
   `Add file → Upload files` → فایل‌ها و پوشه `assets` را بکشید و رها کنید → `Commit changes`.
   یا با ترمینال:
   ```bash
   git init
   git add .
   git commit -m "Hamyar Vam prototype"
   git branch -M main
   git remote add origin https://github.com/USERNAME/hamyar-vam-prototype.git
   git push -u origin main
   ```
3. در مخزن بروید به `Settings → Pages`.
   در بخش **Build and deployment**: `Source = Deploy from a branch`، شاخه `main` و پوشه `/ (root)` → `Save`.
4. بعد از یکی دو دقیقه لینک این شکلی ساخته می‌شود:
   `https://USERNAME.github.io/hamyar-vam-prototype/`
   همین لینک را برای مشتری بفرستید.

## لینک‌های مفید برای مشتری

| صفحه | آدرس |
|---|---|
| صفحه معرفی و فهرست همه صفحه‌ها | `index.html` |
| شروع مستقیم اپ متقاضی (برای تست با کاربر) | `Main.html` |
| پنل کارشناس | `Dashboard.html` |
| نتیجه با چراغ سبز / قرمز | `Result.html?variant=green` و `Result.html?variant=red` |
| حالت عکس تار | `Upload.html?blurry=true` |

برای تست با کاربران بالای ۶۰ سال، لینک `Main.html` را مستقیم روی گوشی‌شان باز کنید.

## ساختار فایل‌ها

```
index.html          صفحه معرفی پروتوتایپ
Main.html … About.html          صفحه‌های اپ متقاضی
Dashboard.html … Rules.html     پنل کارشناس
Components.html     برگه اجزا و رنگ‌ها
assets/site.css     فونت و تنظیمات نمایش موبایل/دسکتاپ
assets/hv-runtime.js  موتور کوچک قالب‌ها و تعامل‌ها
assets/morphdom.min.js  کتابخانه به‌روزرسانی صفحه (MIT)
assets/fonts/       فونت وزیرمتن (OFL)
```

## جاهای خالی که باید پر شوند

`[شماره تماس]`، `[مبلغ خدمت]`، `[نشانی دفتر]`، `[ساعت کاری]`، و `[عکس]` و `[نام]` اعضای تیم.
با جستجوی همین عبارت‌ها در فایل‌های `.html` پیدا می‌شوند.
