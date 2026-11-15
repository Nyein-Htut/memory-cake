// All UI text lives here as [Chinese, English] pairs. To add a string, add
// one line and use t("your.key") in a component.
export const LANGS = ["zh", "en"];
export const DEFAULT_LANG = "zh";
export const LANG_COOKIE = "mc_lang";

const entries = {
  // ---- meta / nav ----
  "meta.description": ["一个珍藏甜蜜回忆的地方。", "A sweet place to keep your memories."],
  "nav.language": ["语言", "Language"],
  "nav.design": ["DIY 设计", "DIY Design"],
  "nav.designAria": ["DIY 蛋糕设计", "DIY Cake Design"],
  "nav.orders": ["我的订单", "My Orders"],
  "nav.notifications": ["通知", "Notifications"],

  // ---- common ----
  "common.loading": ["加载中...", "Loading..."],
  "common.close": ["关闭", "Close"],
  "common.prev": ["上一张", "Previous"],
  "common.next": ["下一张", "Next"],
  "common.continue": ["继续", "Continue"],
  "common.clear": ["清除", "Clear"],
  "common.yourPhone": ["您的手机号", "Your phone number"],
  "count.photoOne": ["1 张照片", "1 photo"],
  "count.photoMany": ["{n} 张照片", "{n} photos"],

  // ---- homepage / folder page ----
  "home.title": ["🎂 蛋糕作品分类", "🎂 Our Cake Collections"],
  "home.subtitle": ["每一款蛋糕，都是独一无二的回忆", "Every cake is a one-of-a-kind memory"],
  "home.empty": ["暂无相册", "No albums yet."],
  "home.emptySub": ["敬请期待，新的作品即将上线", "Check back soon — new memories are on the way."],
  "home.noPhotos": ["暂无照片", "No photos yet"],
  "folder.back": ["← 全部相册", "← All albums"],
  "folder.empty": ["此相册暂无照片", "No photos in this album yet."],
  "folder.footer": ["Memory Cake · 始于 2023", "Memory Cake · since 2023"],

  // ---- footer ----
  "footer.tagline": [
    "手工制作的蛋糕，用心装点，为记忆而生。每一份订单都是一场小小的仪式，我们也这样对待。",
    "Handcrafted cakes, made with care and dressed to remember. Every order is a small ceremony — we treat it like one.",
  ],
  "footer.explore": ["探索", "Explore"],
  "footer.albums": ["相册", "Albums"],
  "footer.work": ["我们的作品", "Our Work"],
  "footer.connect": ["联系我们", "Connect"],
  "footer.wechat": ["微信：", "WeChat: "],
  "footer.copied": ["已复制！", "Copied!"],
  "footer.tapCopy": ["点击复制微信号", "Tap to copy ID"],
  "footer.rights": ["版权所有。", "All rights reserved."],
  "footer.crafted": ["用心制作，始于 2023", "Crafted with care, since 2023"],

  // ---- photo gallery ----
  "gallery.share": ["分享到微信", "Share to WeChat"],
  "gallery.order": ["订购", "Order"],
  "gallery.askPrice": ["价格请咨询客服", "Ask us for the price"],
  "gallery.shareText": ["快来看看这款蛋糕！", "Come and see this cake!"],
  "gallery.linkCopied": [
    "图片链接已复制，可粘贴到微信分享给好友",
    "Image link copied — paste it into WeChat to share",
  ],
  "gallery.loadingMore": ["正在加载更多照片...", "Loading more photos..."],

  // ---- order form ----
  "order.titleCake": ["订购这款蛋糕", "Order this cake"],
  "order.titleDessert": ["订购这款甜品", "Order this dessert"],
  "order.intro": [
    "填写以下信息，我们会尽快与您联系确认订单",
    "Fill in the details below and we'll contact you shortly to confirm your order",
  ],
  "order.photoAlt": ["蛋糕图片", "Cake photo"],
  "order.submitted": ["订购信息已提交！🎂", "Order submitted! 🎂"],
  "order.submittedSub": [
    "我们会尽快通过您留下的电话与您联系。这是您的订购卡片：",
    "We'll contact you soon by phone. Here is your order card:",
  ],
  "order.wechat": ["微信账号名 *", "WeChat name *"],
  "order.wechatPh": ["请输入您的微信昵称或账号名", "Your WeChat nickname or ID"],
  "order.clearWechat": ["清空微信账号名", "Clear WeChat name"],
  "order.pickFlavor": ["选择口味 *", "Choose a flavor *"],
  "order.size": ["尺寸 *", "Size *"],
  "order.noOptions": ["暂无可选项，请联系客服咨询价格", "No options available — please contact us for pricing"],
  "order.qty": ["数量 *", "Quantity *"],
  "order.minQtyLow": ["此甜品最少需要订购 {n} 份，请增加数量", "Minimum order for this dessert is {n}. Please increase the quantity."],
  "order.minQtyOk": ["最少订购 {n} 份", "Minimum order: {n}"],
  "order.subtotal": ["小计：MMK {p}", "Subtotal: MMK {p}"],
  "order.flavor": ["口味", "Flavor"],
  "order.filling1": ["夹心 / 水果 1", "Filling / Fruit 1"],
  "order.filling2": ["夹心 / 水果 2", "Filling / Fruit 2"],
  "order.date": ["取货/配送日期", "Pickup / delivery date"],
  "order.time": ["期望时间", "Preferred time"],
  "order.address": ["配送地址 *", "Delivery address *"],
  "order.addressPh": ["请输入配送地址或到店自取", "Delivery address, or write 'pickup'"],
  "order.phone": ["联系电话 *", "Phone number *"],
  "order.phonePh": ["请输入手机号码", "Your phone number"],
  "order.clearPhone": ["清空联系电话", "Clear phone number"],
  "order.remark": ["备注", "Notes"],
  "order.remarkPh": ["如有特殊要求，请在此说明", "Any special requests?"],
  "order.submit": ["提交订购", "Submit order"],
  "order.submitting": ["提交中...", "Submitting..."],
  "order.errWechat": ["请填写微信账号名", "Please enter your WeChat name"],
  "order.errSize": ["请选择尺寸", "Please choose a size"],
  "order.errFlavor": ["请选择口味", "Please choose a flavor"],
  "order.errMinQty": ["此甜品最少需要订购 {n} 份，请修改数量后重新提交", "Minimum order for this dessert is {n}. Please change the quantity and resubmit."],
  "order.errAddrPhone": ["请填写配送地址和联系电话", "Please enter a delivery address and phone number"],
  "order.errSubmit": ["提交失败，请稍后重试", "Submission failed, please try again later"],

  // ---- order receipt card ----
  "receipt.subtitle": ["记忆蛋糕坊 · 订购确认单", "Memory Cake · Order Confirmation"],
  "receipt.wechat": ["微信昵称", "WECHAT"],
  "receipt.item": ["选购 ITEM", "ITEM"],
  "receipt.size": ["尺寸 SIZE", "SIZE"],
  "receipt.qty": ["数量 QTY", "QTY"],
  "receipt.qtyValue": ["{n} 份", "{n}"],
  "receipt.total": ["总价 TOTAL", "TOTAL"],
  "receipt.totalOf": ["{n} 份合计", "{n} pcs total"],
  "receipt.date": ["日期 DATE", "DATE"],
  "receipt.address": ["地址 ADDRESS", "ADDRESS"],
  "receipt.phone": ["电话 PHONE", "PHONE"],
  "receipt.note": ["备注 NOTE", "NOTE"],
  "receipt.orderNo": ["订单编号 #{id} · {date}", "Order #{id} · {date}"],
  "receipt.thanks": ["— 感谢您的订购，期待为您制作 🎂 —", "— Thank you for your order 🎂 —"],
  "receipt.generating": ["正在生成订单卡片...", "Generating order card..."],
  "receipt.failed": ["卡片生成失败，请重试。", "Couldn't generate the card. Please try again."],
  "receipt.retry": ["重新生成", "Try again"],
  "receipt.save": ["💾 保存图片", "💾 Save image"],
  "receipt.share": ["📤 分享卡片", "📤 Share card"],
  "receipt.shareTitle": ["Memory Cake 蛋糕订购", "Memory Cake Order"],
  "receipt.shareText": ["我在Memory Cake订购了这款蛋糕！", "I just ordered this cake at Memory Cake!"],
  "receipt.alt": ["订单卡片", "Order card"],

  // ---- my orders page ----
  "orders.title": ["我的订单", "My Orders"],
  "orders.intro": ["输入下单时使用的手机号，查看订单状态。", "Enter the phone number you used when ordering to see your order status."],
  "orders.view": ["查看我的订单", "View my orders"],
  "orders.looking": ["查询中...", "Looking up..."],
  "orders.loadFail": ["无法加载订单，请重试。", "Could not load orders. Please try again."],
  "orders.none": ["未找到该手机号的订单。", "No orders found for that phone number."],
  "orders.noFlavor": ["未指定口味", "No flavor specified"],
  "orders.delivery": ["配送：", "Delivery:"],
  "orders.notSet": ["未设置", "Not set"],
  "orders.addressLabel": ["地址：", "Address:"],
  "orders.message": ["💬 联系我们", "💬 Message us"],
  "orders.cancel": ["取消订单", "Cancel order"],
  "orders.cancelling": ["取消中...", "Cancelling..."],
  "orders.cancelTitle": ["距配送时间不足 24 小时，无法取消", "Orders can't be cancelled within 24 hours of delivery"],
  "orders.cancelHint": ["距配送不足 24 小时无法取消，请联系我们", "Can't cancel within 24h of delivery — message us instead"],
  "orders.cancelConfirm": ["确定取消此订单？此操作无法撤销。", "Cancel this order? This cannot be undone."],
  "orders.cancelFail": ["取消订单失败。", "Could not cancel order."],
  "orders.zoom": ["放大查看", "View larger"],
  "orders.closePreview": ["✕ 关闭", "✕ Close"],
  "status.new": ["新订单", "New"],
  "status.confirmed": ["已确认", "Confirmed"],
  "status.done": ["已完成", "Completed"],
  "status.cancelled": ["已取消", "Cancelled"],

  // ---- notifications page ----
  "notif.title": ["通知", "Notifications"],
  "notif.sub": ["来自我们的订单和消息更新。", "Updates from us about your orders and messages."],
  "notif.showing": ["正在显示 {phone} 的更新 · ", "Showing updates for {phone} · "],
  "notif.change": ["不是您？更换号码", "Not you? Change number"],
  "notif.caughtUp": ["暂无新消息，您已查看全部。", "You're all caught up — no new updates."],
  "notif.order": ["订单 #{id}", "Order #{id}"],
  "notif.attachment": ["📎 发来一个附件", "📎 Sent an attachment"],

  // ---- chat (widget + panels) ----
  "chat.open": ["在线咨询", "Chat with us"],
  "chat.closeAria": ["关闭聊天", "Close chat"],
  "chat.title": ["在线咨询", "Chat with us"],
  "chat.reply": ["我们通常会在几小时内回复", "We usually reply within a few hours"],
  "chat.enterPhone": ["请输入您的手机号，方便我们联系您。", "Enter your phone number so we know who we're chatting with."],
  "chat.start": ["开始聊天", "Start chat"],
  "chat.titleAdmin": ["客户聊天", "Chat with customer"],
  "chat.emptyAdmin": ["暂无消息。", "No messages yet."],
  "chat.emptySupport": [
    "有任何关于付款方式、配送费或订单的问题，欢迎随时咨询——也可以附上收据或二维码。",
    "Ask us anything about payment methods, delivery fees, or your order — feel free to attach a receipt or QR code.",
  ],
  "chat.you": ["我", "You"],
  "chat.customer": ["客户", "Customer"],
  "chat.viewAttachment": ["📎 查看附件", "📎 View attachment"],
  "chat.askSupport": ["咨询付款、配送费...", "Ask about payment, delivery fee..."],
  "chat.typeMessage": ["输入消息...", "Type a message..."],
  "chat.uploading": ["正在上传附件...", "Uploading attachment..."],
  "chat.sendFail": ["消息发送失败", "Could not send message"],
  "chat.attachFail": ["附件发送失败", "Could not send attachment"],
  "chat.send": ["发送", "Send"],
  "chat.sendAria": ["发送", "Send"],
  "chat.messageCustomer": ["联系客户", "Message customer"],
  "chat.messageUs": ["联系我们", "Message us"],
  "chat.askOrder": ["有关于订单的问题，欢迎随时咨询。", "Ask us anything about your order."],
  "chat.wechatLabel": ["微信：{name}", "WeChat: {name}"],

  // ---- DIY designer ----
  "design.title": ["🎂 DIY 蛋糕设计", "🎂 DIY Cake Design"],
  "design.metaTitle": ["DIY 蛋糕设计 | Memory Cake", "DIY Cake Design | Memory Cake"],
  "design.metaDesc": ["自由搭配形状、颜色与装饰，实时预览你的专属蛋糕设计。", "Mix shapes, colors and decorations and preview your own cake design live."],
  "design.sub": ["挑选形状、颜色与装饰，实时预览属于你的专属蛋糕设计", "Pick shapes, colors and decorations and preview your very own cake design"],
  "design.loading": ["正在加载设计工具...", "Loading the designer..."],
  "design.canvasSub": ["记忆蛋糕坊 · DIY 蛋糕设计预览", "Memory Cake · DIY Cake Design Preview"],
  "design.canvasFooter": ["仅供设计预览 · 实际成品可能因手工制作略有差异", "Design preview only · handmade cakes may vary slightly"],
  "design.save": ["💾 保存图片", "💾 Save image"],
  "design.share": ["📤 分享设计", "📤 Share design"],
  "design.shareTitle": ["我的DIY蛋糕设计", "My DIY cake design"],
  "design.shareText": ["看看我在Memory Cake设计的蛋糕！", "Look at the cake I designed at Memory Cake!"],
  "design.note": [
    "这是一个DIY设计预览工具，暂不支持直接下单。若您喜欢这个设计，欢迎截图后通过客服联系我们 🎂",
    "This is a design preview tool and doesn't support ordering yet. If you love your design, take a screenshot and message us 🎂",
  ],
  "design.themes": ["✨ 快速主题", "✨ Quick themes"],
  "design.shape": ["形状", "Shape"],
  "design.round": ["圆形", "Round"],
  "design.square": ["方形", "Square"],
  "design.heart": ["心形", "Heart"],
  "design.tiers": ["层数", "Tiers"],
  "design.single": ["单层", "Single"],
  "design.double": ["双层", "Double"],
  "design.size": ["大小", "Size"],
  "design.small": ["小", "Small"],
  "design.medium": ["中", "Medium"],
  "design.large": ["大", "Large"],
  "design.frostingColor": ["奶油颜色", "Frosting color"],
  "design.frostingTexture": ["奶油质感", "Frosting texture"],
  "design.smooth": ["顺滑", "Smooth"],
  "design.swirl": ["奶油纹理", "Swirled"],
  "design.drip": ["淋面滴落效果", "Drip effect"],
  "design.border": ["贝壳花边（底部）", "Shell border (bottom)"],
  "design.ribbon": ["丝带装饰", "Ribbon"],
  "design.toppers": ["装饰配件", "Decorations"],
  "design.candles": ["蜡烛数量：{n}", "Candles: {n}"],
  "design.message": ["蛋糕文字", "Cake message"],
  "design.messagePh": ["例如：Happy Birthday", "e.g. Happy Birthday"],
  "design.messageMax": ["最多24个字符", "Up to 24 characters"],
  "design.rendering": ["正在生成预览...", "Generating preview..."],
};

export const dictionaries = { zh: {}, en: {} };
for (const [key, pair] of Object.entries(entries)) {
  dictionaries.zh[key] = pair[0];
  dictionaries.en[key] = pair[1];
}

export function translate(lang, key, vars) {
  let str = dictionaries[lang]?.[key] ?? dictionaries[DEFAULT_LANG][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

// Pick the English text when the visitor is in English AND it was filled in;
// otherwise fall back to the original (Chinese) text.
export function pickLang(lang, zh, en) {
  if (lang === "en" && typeof en === "string" && en.trim()) return en;
  return zh;
}

export function photoCountLabel(t, n) {
  return n === 1 ? t("count.photoOne") : t("count.photoMany", { n });
}
