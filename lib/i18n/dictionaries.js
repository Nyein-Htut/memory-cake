// All UI text lives here as [Chinese, English, Burmese] triples. To add a
// string, add one line and use t("your.key") in a component.
// The Burmese entry is optional: if it's missing, Burmese visitors see English.
export const LANGS = ["zh", "en", "my"];
export const DEFAULT_LANG = "zh";
export const LANG_COOKIE = "mc_lang";

// <html lang="..."> value for each language.
export function htmlLang(lang) {
  if (lang === "en") return "en";
  if (lang === "my") return "my";
  return "zh-CN";
}

// Date/number locale for toLocaleString(). Burmese uses en-GB on purpose so
// dates and times stay in plain digits, matching the MMK amounts.
export function localeOf(lang) {
  return lang === "zh" ? "zh-CN" : "en-GB";
}

const entries = {
  // ---- meta / nav ----
  "meta.description": ["一个珍藏甜蜜回忆的地方。", "A sweet place to keep your memories.", "ချိုမြိန်သောအမှတ်တရများကို သိမ်းဆည်းရာနေရာ"],
  "nav.language": ["语言", "Language", "ဘာသာစကား"],
  "nav.design": ["DIY 设计", "DIY Design", "DIY ဒီဇိုင်း"],
  "nav.designAria": ["DIY 蛋糕设计", "DIY Cake Design", "DIY ကိတ်ဒီဇိုင်း"],
  "nav.orders": ["我的订单", "My Orders", "အော်ဒါများ"],
  "nav.notifications": ["通知", "Notifications", "အသိပေးချက်"],

  // ---- common ----
  "common.loading": ["加载中...", "Loading...", "ခဏစောင့်ပါ..."],
  "common.close": ["关闭", "Close", "ပိတ်မည်"],
  "common.prev": ["上一张", "Previous", "ရှေ့"],
  "common.next": ["下一张", "Next", "နောက်"],
  "common.continue": ["继续", "Continue", "ဆက်လုပ်မည်"],
  "common.clear": ["清除", "Clear", "ဖျက်မည်"],
  "common.yourPhone": ["您的手机号", "Your phone number", "သင့်ဖုန်းနံပါတ်"],
  "count.photoOne": ["1 张照片", "1 photo", "ဓာတ်ပုံ 1 ပုံ"],
  "count.photoMany": ["{n} 张照片", "{n} photos", "ဓာတ်ပုံ {n} ပုံ"],

  // ---- homepage / folder page ----
  "home.title": ["🎂 蛋糕作品分类", "🎂 Our Cake Collections", "🎂 ကိတ်မုန့်စုစည်းမှုများ"],
  "home.subtitle": ["每一款蛋糕，都是独一无二的回忆", "Every cake is a one-of-a-kind memory", "ကိတ်မုန့်တိုင်းဟာ တစ်မူထူးခြားတဲ့ အမှတ်တရလေးတွေပါ"],
  "home.empty": ["暂无相册", "No albums yet.", "အယ်လ်ဘမ် မရှိသေးပါ"],
  "home.emptySub": ["敬请期待，新的作品即将上线", "Check back soon — new memories are on the way.", "မကြာမီ လက်ရာသစ်များ ရောက်လာပါမည်"],
  "home.noPhotos": ["暂无照片", "No photos yet", "ဓာတ်ပုံ မရှိသေးပါ"],
  "folder.back": ["← 全部相册", "← All albums", "← အယ်လ်ဘမ်အားလုံး"],
  "folder.empty": ["此相册暂无照片", "No photos in this album yet.", "ဤအယ်လ်ဘမ်တွင် ဓာတ်ပုံ မရှိသေးပါ"],
  "folder.footer": ["Memory Cake · 始于 2023", "Memory Cake · since 2023", "Memory Cake · 2023 မှစ၍"],

  // ---- footer ----
  "footer.tagline": [
    "手工制作的蛋糕，用心装点，为记忆而生。每一份订单都是一场小小的仪式，我们也这样对待。",
    "Handcrafted cakes, made with care and dressed to remember. Every order is a small ceremony — we treat it like one.",
    "လက်ဖြင့်ပြုလုပ်သော ကိတ်မုန့်များ၊ အမှတ်တရအတွက် ဂရုတစိုက် ပြင်ဆင်ထားပါသည်။ အော်ဒါတိုင်းကို အထူးအခမ်းအနားတစ်ခုအဖြစ် ဆက်ဆံပါသည်။",
  ],
  "footer.explore": ["探索", "Explore", "ရှာဖွေရန်"],
  "footer.albums": ["相册", "Albums", "အယ်လ်ဘမ်များ"],
  "footer.work": ["我们的作品", "Our Work", "ကျွန်ုပ်တို့၏ လက်ရာ"],
  "footer.connect": ["联系我们", "Connect", "ဆက်သွယ်ရန်"],
  "footer.wechat": ["微信：", "WeChat: ", "WeChat: "],
  "footer.copied": ["已复制！", "Copied!", "ကူးပြီးပါပြီ!"],
  "footer.tapCopy": ["点击复制微信号", "Tap to copy ID", "နှိပ်၍ ID ကူးပါ"],
  "footer.rights": ["版权所有。", "All rights reserved.", "မူပိုင်ခွင့်ရယူထားသည်။"],
  "footer.crafted": ["用心制作，始于 2023", "Crafted with care, since 2023", "ဂရုတစိုက်ပြုလုပ် · 2023 မှစ၍"],

  // ---- photo gallery ----
  "gallery.share": ["分享到微信", "Share to WeChat", "WeChat သို့ မျှဝေ"],
  "gallery.order": ["订购", "Order", "မှာမည်"],
  "gallery.askPrice": ["价格请咨询客服", "Ask us for the price", "စျေးနှုန်း မေးမြန်းပါ"],
  "gallery.shareText": ["快来看看这款蛋糕！", "Come and see this cake!", "ဒီကိတ်လေး ကြည့်ပါဦး!"],
  "gallery.linkCopied": [
    "图片链接已复制，可粘贴到微信分享给好友",
    "Image link copied — paste it into WeChat to share",
    "ပုံလင့်ခ် ကူးပြီးပါပြီ၊ WeChat တွင် paste လုပ်၍ မျှဝေပါ",
  ],
  "gallery.loadingMore": ["正在加载更多照片...", "Loading more photos...", "ဓာတ်ပုံများ ထပ်ယူနေသည်..."],

  // ---- order form ----
  "order.titleCake": ["订购这款蛋糕", "Order this cake", "ဤကိတ်ကို မှာမည်"],
  "order.titleDessert": ["订购这款甜品", "Order this dessert", "ဤအချိုပွဲကို မှာမည်"],
  "order.intro": [
    "填写以下信息，我们会尽快与您联系确认订单",
    "Fill in the details below and we'll contact you shortly to confirm your order",
    "အောက်ပါအချက်များ ဖြည့်ပါ၊ အတည်ပြုရန် မကြာမီ ဆက်သွယ်ပါမည်",
  ],
  "order.photoAlt": ["蛋糕图片", "Cake photo", "ကိတ်ဓာတ်ပုံ"],
  "order.submitted": ["订购信息已提交！🎂", "Order submitted! 🎂", "အော်ဒါ တင်ပြီးပါပြီ! 🎂"],
  "order.submittedSub": [
    "我们会尽快通过您留下的电话与您联系。这是您的订购卡片：",
    "We'll contact you soon by phone. Here is your order card:",
    "ဖုန်းဖြင့် မကြာမီ ဆက်သွယ်ပါမည်။ သင့်အော်ဒါကတ် -",
  ],
  "order.wechat": ["微信账号名 *", "WeChat name *", "WeChat အမည် *"],
  "order.wechatPh": ["请输入您的微信昵称或账号名", "Your WeChat nickname or ID", "WeChat အမည် သို့မဟုတ် ID"],
  "order.clearWechat": ["清空微信账号名", "Clear WeChat name", "WeChat အမည် ဖျက်မည်"],
  "order.pickFlavor": ["选择口味 *", "Choose a flavor *", "အရသာ ရွေးပါ *"],
  "order.size": ["尺寸 *", "Size *", "အရွယ်အစား *"],
  "order.noOptions": ["暂无可选项，请联系客服咨询价格", "No options available — please contact us for pricing", "ရွေးစရာ မရှိပါ၊ စျေးနှုန်းအတွက် ဆက်သွယ်ပါ"],
  "order.qty": ["数量 *", "Quantity *", "အရေအတွက် *"],
  "order.minQtyLow": ["此甜品最少需要订购 {n} 份，请增加数量", "Minimum order for this dessert is {n}. Please increase the quantity.", "အနည်းဆုံး {n} ခု မှာရပါမည်၊ တိုးပါ"],
  "order.minQtyOk": ["最少订购 {n} 份", "Minimum order: {n}", "အနည်းဆုံး {n} ခု"],
  "order.subtotal": ["小计：MMK {p}", "Subtotal: MMK {p}", "ပေါင်း: MMK {p}"],
  "order.flavor": ["口味", "Flavor", "အရသာ"],
  "order.filling1": ["夹心 / 水果 1", "Filling / Fruit 1", "ကြားညှပ်မည့် ယို / သစ်သီး 1"],
  "order.filling2": ["夹心 / 水果 2", "Filling / Fruit 2", "ကြားညှပ်မည့် ယို / သစ်သီး 2"],
  "order.date": ["取货/配送日期", "Pickup / delivery date", "ယူမည့်/ပို့မည့်ရက်"],
  "order.time": ["期望时间", "Preferred time", "အချိန်"],
  "order.township": ["配送区域 *", "Delivery township *", "မြို့နယ် *"],
  "order.townshipPh": ["选择配送区域", "Select a township", "မြို့နယ် ရွေးပါ"],
  "order.townshipTitle": ["可配送区域", "Delivery areas", "ပို့ဆောင်သောနေရာ"],
  "order.townshipNote": [
    "仅限以上区域配送，其他区域暂不支持",
    "We only deliver to the townships above — other areas aren't available",
    "အထက်ပါမြို့နယ်များသာ ပို့ဆောင်ပေးပါသည်",
  ],
  "order.townshipNone": ["暂未开放配送区域，请联系客服", "No delivery areas yet — please contact us", "ပို့ဆောင်သောနေရာ မရှိသေးပါ၊ ဆက်သွယ်ပါ"],
  "order.townshipSearchPh": ["搜索区域…", "Search township…", "မြို့နယ် ရှာရန်…"],
  "order.townshipNoMatch": ["没有找到匹配的区域", "No matching township", "ကိုက်ညီသော မြို့နယ် မတွေ့ပါ"],
  "order.deliveryFee": ["配送费", "Delivery fee", "ပို့ခ"],
  "order.free": ["免费", "Free", "အခမဲ့"],
  "order.itemPrice": ["商品价格", "Item price", "ပစ္စည်းဈေး"],
  "order.totalPay": ["应付总额", "Total payment", "ပေးရမည့်စုစုပေါင်း"],
  "order.pickTownshipFirst": ["请先选择配送区域", "Select a township first", "မြို့နယ် အရင်ရွေးပါ"],
  "order.address": ["详细地址 *", "Address details *", "အသေးစိတ်လိပ်စာ *"],
  "order.addressPh": ["街道、楼栋、门牌号", "Street, building, house no.", "လမ်း၊ အဆောက်အအုံ၊ အိမ်အမှတ်"],
  "order.phone": ["联系电话 *", "Phone number *", "ဖုန်းနံပါတ် *"],
  "order.phonePh": ["请输入手机号码", "Your phone number", "သင့်ဖုန်းနံပါတ်"],
  "order.clearPhone": ["清空联系电话", "Clear phone number", "ဖုန်းနံပါတ် ဖျက်မည်"],
  "order.remark": ["备注", "Notes", "မှတ်ချက်"],
  "order.remarkPh": ["如有特殊要求，请在此说明", "Any special requests?", "အထူးလိုအပ်ချက် ရှိပါသလား?"],
  "order.submit": ["提交订购", "Submit order", "အော်ဒါတင်မည်"],
  "order.submitting": ["提交中...", "Submitting...", "တင်နေသည်..."],
  "order.errWechat": ["请填写微信账号名", "Please enter your WeChat name", "WeChat အမည် ဖြည့်ပါ"],
  "order.errSize": ["请选择尺寸", "Please choose a size", "အရွယ်အစား ရွေးပါ"],
  "order.errFlavor": ["请选择口味", "Please choose a flavor", "အရသာ ရွေးပါ"],
  "order.errMinQty": ["此甜品最少需要订购 {n} 份，请修改数量后重新提交", "Minimum order for this dessert is {n}. Please change the quantity and resubmit.", "အနည်းဆုံး {n} ခု မှာရပါမည်၊ ပြင်ပြီး ထပ်တင်ပါ"],
  "order.errTownship": ["请选择配送区域", "Please select a delivery township", "မြို့နယ် ရွေးပါ"],
  "order.errAddrPhone": ["请填写详细地址和联系电话", "Please enter your address details and phone number", "လိပ်စာနှင့် ဖုန်းနံပါတ် ဖြည့်ပါ"],
  "order.errSubmit": ["提交失败，请稍后重试", "Submission failed, please try again later", "တင်၍မရပါ၊ နောက်မှ ပြန်စမ်းပါ"],

  // ---- order receipt card ----
  "receipt.subtitle": ["记忆蛋糕坊 · 订购确认单", "Memory Cake · Order Confirmation", "Memory Cake · အော်ဒါအတည်ပြုလွှာ"],
  "receipt.wechat": ["微信昵称", "WECHAT", "WECHAT"],
  "receipt.item": ["选购 ITEM", "ITEM", "ပစ္စည်း ITEM"],
  "receipt.size": ["尺寸 SIZE", "SIZE", "အရွယ် SIZE"],
  "receipt.qty": ["数量 QTY", "QTY", "အရေအတွက် QTY"],
  "receipt.qtyValue": ["{n} 份", "{n}", "{n} ခု"],
  "receipt.total": ["总价 TOTAL", "TOTAL", "စုစုပေါင်း TOTAL"],
  "receipt.totalOf": ["{n} 份合计", "{n} pcs total", "{n} ခု ပေါင်း"],
  "receipt.subtotal": ["小计 SUBTOTAL", "SUBTOTAL", "ပေါင်း SUBTOTAL"],
  "receipt.date": ["日期 DATE", "DATE", "ရက်စွဲ DATE"],
  "receipt.township": ["区域 TOWNSHIP", "TOWNSHIP", "မြို့နယ် TOWNSHIP"],
  "receipt.address": ["地址 ADDRESS", "ADDRESS", "လိပ်စာ ADDRESS"],
  "receipt.phone": ["电话 PHONE", "PHONE", "ဖုန်း PHONE"],
  "receipt.note": ["备注 NOTE", "NOTE", "မှတ်ချက် NOTE"],
  "receipt.deliveryFee": ["配送费 DELIVERY", "DELIVERY FEE", "ပို့ခ DELIVERY"],
  "receipt.free": ["免费", "Free", "အခမဲ့"],
  "receipt.totalPay": ["应付总额", "TOTAL DUE", "ပေးရမည့်ပမာဏ"],
  "receipt.orderNo": ["订单编号 #{id} · {date}", "Order #{id} · {date}", "အော်ဒါ #{id} · {date}"],
  "receipt.thanks": ["— 感谢您的订购，期待为您制作 🎂 —", "— Thank you for your order 🎂 —", "— မှာယူသည့်အတွက် ကျေးဇူးတင်ပါသည် 🎂 —"],
  "receipt.generating": ["正在生成订单卡片...", "Generating order card...", "အော်ဒါကတ် ပြုလုပ်နေသည်..."],
  "receipt.failed": ["卡片生成失败，请重试。", "Couldn't generate the card. Please try again.", "ကတ်ပြုလုပ်၍ မရပါ၊ ပြန်စမ်းပါ။"],
  "receipt.retry": ["重新生成", "Try again", "ပြန်လုပ်မည်"],
  "receipt.save": ["💾 保存图片", "💾 Save image", "💾 ပုံသိမ်းမည်"],
  "receipt.share": ["📤 分享卡片", "📤 Share card", "📤 ကတ်မျှဝေမည်"],
  "receipt.shareTitle": ["Memory Cake 蛋糕订购", "Memory Cake Order", "Memory Cake အော်ဒါ"],
  "receipt.shareText": ["我在Memory Cake订购了这款蛋糕！", "I just ordered this cake at Memory Cake!", "Memory Cake မှာ ဒီကိတ်မှာလိုက်ပါပြီ!"],
  "receipt.alt": ["订单卡片", "Order card", "အော်ဒါကတ်"],

  // ---- my orders page ----
  "orders.title": ["我的订单", "My Orders", "ကျွန်ုပ်၏အော်ဒါများ"],
  "orders.intro": ["输入下单时使用的手机号，查看订单状态。", "Enter the phone number you used when ordering to see your order status.", "မှာယူစဉ်က သုံးခဲ့သော ဖုန်းနံပါတ်ဖြင့် အော်ဒါအခြေအနေ ကြည့်ပါ။"],
  "orders.view": ["查看我的订单", "View my orders", "အော်ဒါကြည့်မည်"],
  "orders.looking": ["查询中...", "Looking up...", "ရှာနေသည်..."],
  "orders.loadFail": ["无法加载订单，请重试。", "Could not load orders. Please try again.", "အော်ဒါများ မရယူနိုင်ပါ၊ ပြန်စမ်းပါ။"],
  "orders.none": ["未找到该手机号的订单。", "No orders found for that phone number.", "ဤဖုန်းနံပါတ်ဖြင့် အော်ဒါ မတွေ့ပါ။"],
  "orders.noFlavor": ["未指定口味", "No flavor specified", "အရသာ မသတ်မှတ်ပါ"],
  "orders.delivery": ["配送：", "Delivery:", "ပို့ရန်:"],
  "orders.notSet": ["未设置", "Not set", "မသတ်မှတ်ရသေး"],
  "orders.addressLabel": ["地址：", "Address:", "လိပ်စာ:"],
  "orders.deliveryFee": ["配送费", "Delivery fee", "ပို့ခ"],
  "orders.total": ["应付总额", "Total", "စုစုပေါင်း"],
  "orders.free": ["免费", "Free", "အခမဲ့"],
  "orders.message": ["💬 联系我们", "💬 Message us", "💬 စာပို့မည်"],
  "orders.cancel": ["取消订单", "Cancel order", "အော်ဒါ ဖျက်မည်"],
  "orders.cancelling": ["取消中...", "Cancelling...", "ဖျက်နေသည်..."],
  "orders.cancelTitle": ["距配送时间不足 24 小时，无法取消", "Orders can't be cancelled within 24 hours of delivery", "ပို့ချိန် 24 နာရီအတွင်း ဖျက်၍မရပါ"],
  "orders.cancelHint": ["距配送不足 24 小时无法取消，请联系我们", "Can't cancel within 24h of delivery — message us instead", "ပို့ချိန် 24 နာရီအတွင်း ဖျက်၍မရပါ၊ ဆက်သွယ်ပါ"],
  "orders.cancelConfirm": ["确定取消此订单？此操作无法撤销。", "Cancel this order? This cannot be undone.", "ဤအော်ဒါကို ဖျက်မလား? ပြန်ပြင်၍ မရပါ။"],
  "orders.cancelFail": ["取消订单失败。", "Could not cancel order.", "အော်ဒါ ဖျက်၍မရပါ။"],
  "orders.zoom": ["放大查看", "View larger", "ချဲ့ကြည့်"],
  "orders.closePreview": ["✕ 关闭", "✕ Close", "✕ ပိတ်မည်"],
  "status.new": ["新订单", "New", "အသစ်"],
  "status.confirmed": ["已确认", "Confirmed", "အတည်ပြုပြီး"],
  "status.done": ["已完成", "Completed", "ပြီးစီး"],
  "status.cancelled": ["已取消", "Cancelled", "ဖျက်ပြီး"],

  // ---- notifications page ----
  "notif.title": ["通知", "Notifications", "အသိပေးချက်"],
  "notif.sub": ["来自我们的订单和消息更新。", "Updates from us about your orders and messages.", "သင့်အော်ဒါနှင့် မက်ဆေ့ချ်များ၏ အပ်ဒိတ်များ။"],
  "notif.showing": ["正在显示 {phone} 的更新 · ", "Showing updates for {phone} · ", "{phone} အတွက် အပ်ဒိတ်များ · "],
  "notif.change": ["不是您？更换号码", "Not you? Change number", "သင်မဟုတ်ဘူးလား? နံပါတ်ပြောင်းမည်"],
  "notif.caughtUp": ["暂无新消息，您已查看全部。", "You're all caught up — no new updates.", "အသစ် မရှိပါ၊ အားလုံး ကြည့်ပြီးပါပြီ။"],
  "notif.order": ["订单 #{id}", "Order #{id}", "အော်ဒါ #{id}"],
  "notif.attachment": ["📎 发来一个附件", "📎 Sent an attachment", "📎 ဖိုင်ပို့ထားသည်"],

  // ---- chat (widget + panels) ----
  "chat.open": ["在线咨询", "Chat with us", "စကားပြောမည်"],
  "chat.closeAria": ["关闭聊天", "Close chat", "ချတ်ပိတ်မည်"],
  "chat.title": ["在线咨询", "Chat with us", "စကားပြောမည်"],
  "chat.reply": ["我们通常会在几小时内回复", "We usually reply within a few hours", "နာရီအနည်းငယ်အတွင်း ပြန်ကြားပါသည်"],
  "chat.enterPhone": ["请输入您的手机号，方便我们联系您。", "Enter your phone number so we know who we're chatting with.", "ဆက်သွယ်နိုင်ရန် သင့်ဖုန်းနံပါတ် ထည့်ပါ။"],
  "chat.start": ["开始聊天", "Start chat", "စတင်မည်"],
  "chat.titleAdmin": ["客户聊天", "Chat with customer", "ဖောက်သည်နှင့် ချတ်"],
  "chat.emptyAdmin": ["暂无消息。", "No messages yet.", "မက်ဆေ့ချ် မရှိသေးပါ။"],
  "chat.emptySupport": [
    "有任何关于付款方式、配送费或订单的问题，欢迎随时咨询——也可以附上收据或二维码。",
    "Ask us anything about payment methods, delivery fees, or your order — feel free to attach a receipt or QR code.",
    "ငွေပေးချေမှု၊ ပို့ခ၊ အော်ဒါ အကြောင်း မေးနိုင်ပါသည် - ပြေစာ/QR လည်း ပူးတွဲနိုင်ပါသည်။",
  ],
  "chat.you": ["我", "You", "ကျွန်ုပ်"],
  "chat.customer": ["客户", "Customer", "ဖောက်သည်"],
  "chat.viewAttachment": ["📎 查看附件", "📎 View attachment", "📎 ဖိုင်ကြည့်မည်"],
  "chat.askSupport": ["咨询付款、配送费...", "Ask about payment, delivery fee...", "ငွေပေးချေမှု၊ ပို့ခ မေးရန်..."],
  "chat.typeMessage": ["输入消息...", "Type a message...", "စာရိုက်ပါ..."],
  "chat.uploading": ["正在上传附件...", "Uploading attachment...", "ဖိုင်တင်နေသည်..."],
  "chat.sendFail": ["消息发送失败", "Could not send message", "မပို့နိုင်ပါ"],
  "chat.attachFail": ["附件发送失败", "Could not send attachment", "ဖိုင် မပို့နိုင်ပါ"],
  "chat.send": ["发送", "Send", "ပို့မည်"],
  "chat.sendAria": ["发送", "Send", "ပို့မည်"],
  "chat.messageCustomer": ["联系客户", "Message customer", "ဖောက်သည်ထံ စာပို့မည်"],
  "chat.messageUs": ["联系我们", "Message us", "ကျွန်ုပ်တို့ထံ စာပို့မည်"],
  "chat.askOrder": ["有关于订单的问题，欢迎随时咨询。", "Ask us anything about your order.", "အော်ဒါနှင့်ပတ်သက်၍ မေးနိုင်ပါသည်။"],
  "chat.wechatLabel": ["微信：{name}", "WeChat: {name}", "WeChat: {name}"],

  // ---- DIY designer ----
  "design.title": ["🎂 DIY 蛋糕设计", "🎂 DIY Cake Design", "🎂 DIY ကိတ်ဒီဇိုင်း"],
  "design.metaTitle": ["DIY 蛋糕设计 | Memory Cake", "DIY Cake Design | Memory Cake", "DIY ကိတ်ဒီဇိုင်း | Memory Cake"],
  "design.metaDesc": ["自由搭配形状、颜色与装饰，实时预览你的专属蛋糕设计。", "Mix shapes, colors and decorations and preview your own cake design live.", "ပုံသဏ္ဌာန်၊ အရောင်၊ အလှဆင်မှု ရောစပ်၍ သင့်ကိတ်ကို တိုက်ရိုက်ကြည့်ပါ။"],
  "design.sub": ["挑选形状、颜色与装饰，实时预览属于你的专属蛋糕设计", "Pick shapes, colors and decorations and preview your very own cake design", "ပုံသဏ္ဌာန်၊ အရောင်၊ အလှဆင်မှု ရွေး၍ သင့်ကိုယ်ပိုင်ကိတ်ကို ချက်ချင်းကြည့်ပါ"],
  "design.loading": ["正在加载设计工具...", "Loading the designer...", "ဒီဇိုင်းကိရိယာ ဖွင့်နေသည်..."],
  "design.canvasSub": ["记忆蛋糕坊 · DIY 蛋糕设计预览", "Memory Cake · DIY Cake Design Preview", "Memory Cake · DIY ကိတ်ဒီဇိုင်း နမူနာ"],
  "design.canvasFooter": ["仅供设计预览 · 实际成品可能因手工制作略有差异", "Design preview only · handmade cakes may vary slightly", "နမူနာသာ · လက်ရာအမှန်နှင့် အနည်းငယ် ကွာနိုင်သည်"],
  "design.save": ["💾 保存图片", "💾 Save image", "💾 ပုံသိမ်းမည်"],
  "design.share": ["📤 分享设计", "📤 Share design", "📤 မျှဝေမည်"],
  "design.shareTitle": ["我的DIY蛋糕设计", "My DIY cake design", "ကျွန်ုပ်၏ DIY ကိတ်ဒီဇိုင်း"],
  "design.shareText": ["看看我在Memory Cake设计的蛋糕！", "Look at the cake I designed at Memory Cake!", "Memory Cake မှာ ဒီဇိုင်းလုပ်ထားတဲ့ ကိတ်ကြည့်ပါဦး!"],
  "design.note": [
    "这是一个DIY设计预览工具，暂不支持直接下单。若您喜欢这个设计，欢迎截图后通过客服联系我们 🎂",
    "This is a design preview tool and doesn't support ordering yet. If you love your design, take a screenshot and message us 🎂",
    "ဤသည်မှာ ဒီဇိုင်းနမူနာကြည့်ရန်သာ ဖြစ်ပြီး တိုက်ရိုက်မှာ၍ မရသေးပါ။ ကြိုက်ပါက screenshot ရိုက်၍ ကျွန်ုပ်တို့ထံ ပို့ပါ 🎂",
  ],
  "design.themes": ["✨ 快速主题", "✨ Quick themes", "✨ အမြန်ရွေး"],
  "design.shape": ["形状", "Shape", "ပုံသဏ္ဌာန်"],
  "design.round": ["圆形", "Round", "ဝိုင်း"],
  "design.square": ["方形", "Square", "စတုရန်း"],
  "design.heart": ["心形", "Heart", "နှလုံး"],
  "design.tiers": ["层数", "Tiers", "အလွှာ"],
  "design.single": ["单层", "Single", "တစ်လွှာ"],
  "design.double": ["双层", "Double", "နှစ်လွှာ"],
  "design.size": ["大小", "Size", "အရွယ်"],
  "design.small": ["小", "Small", "သေး"],
  "design.medium": ["中", "Medium", "အလတ်"],
  "design.large": ["大", "Large", "ကြီး"],
  "design.frostingColor": ["奶油颜色", "Frosting color", "ခရင်မ်အရောင်"],
  "design.frostingTexture": ["奶油质感", "Frosting texture", "ခရင်မ်ပုံစံ"],
  "design.smooth": ["顺滑", "Smooth", "ချောမွေ့"],
  "design.swirl": ["奶油纹理", "Swirled", "လှည့်ပတ်"],
  "design.drip": ["淋面滴落效果", "Drip effect", "စီးကျအလှ"],
  "design.border": ["贝壳花边（底部）", "Shell border (bottom)", "အောက်ခြေအနားကွပ်"],
  "design.ribbon": ["丝带装饰", "Ribbon", "ဖဲကြိုး"],
  "design.toppers": ["装饰配件", "Decorations", "အလှဆင်ပစ္စည်း"],
  "design.candles": ["蜡烛数量：{n}", "Candles: {n}", "ဖယောင်းတိုင်: {n}"],
  "design.message": ["蛋糕文字", "Cake message", "ကိတ်ပေါ်စာသား"],
  "design.messagePh": ["例如：Happy Birthday", "e.g. Happy Birthday", "ဥပမာ - Happy Birthday"],
  "design.messageMax": ["最多24个字符", "Up to 24 characters", "စာလုံး 24 လုံးအထိ"],
  "design.rendering": ["正在生成预览...", "Generating preview...", "နမူနာ ပြုလုပ်နေသည်..."],
};

export const dictionaries = { zh: {}, en: {}, my: {} };
for (const [key, pair] of Object.entries(entries)) {
  dictionaries.zh[key] = pair[0];
  dictionaries.en[key] = pair[1];
  // Missing Burmese falls back to English.
  dictionaries.my[key] = pair[2] ?? pair[1];
}

export function translate(lang, key, vars) {
  let str =
    dictionaries[lang]?.[key] ??
    dictionaries.en[key] ??
    dictionaries[DEFAULT_LANG][key] ??
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

// Admin-entered content (folder names, captions, option labels) only has a
// Chinese original plus an optional English version. Anyone not in Chinese
// mode (English or Burmese) sees the English text when it was filled in;
// otherwise they fall back to the original Chinese.
export function pickLang(lang, zh, en) {
  if (lang !== "zh" && typeof en === "string" && en.trim()) return en;
  return zh;
}

export function photoCountLabel(t, n) {
  return n === 1 ? t("count.photoOne") : t("count.photoMany", { n });
}
