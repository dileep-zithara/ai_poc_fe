/** Test customer WhatsApp only — never the Tyaani business line. */
export const TEST_CUSTOMER_WHATSAPP = "917275724262";
export const TYAANI_BUSINESS_WHATSAPP = "919619587978";

export const WEBHOOK_SAMPLES = [
  {
    id: "wa-text-ad",
    label: "WhatsApp · text + ad referral",
    channel: "whatsapp",
    json: {
      from: "917275724262",
      profile: { name: "Riya" },
      id: "wamid.HBgMOTE5MzQ4MDMzMzEwFQIAEhgUM0FCQ0RFRjAxMjM0NTY3ODk",
      wmaid: "wamid.HBgMOTE5MzQ4MDMzMzEwFQIAEhgUM0FCQ0RFRjAxMjM0NTY3ODk",
      timestamp: "1788490000",
      type: "text",
      text: { body: "I'd like to know the price of a design" },
      referral: {
        source_url: "https://fb.me/f5Hq4zIPC",
        source_id: "120247849538730570",
        source_type: "ad",
        body: "Selected pieces only, while stocks last. Visit your nearest Tyaani Store today",
        headline: "100% off on making charges",
        media_type: "image",
        image_url: "https://tyaani.com/cdn/shop/files/sample.jpg",
        welcome_message: { text: "Welcome to Tyaani. Tell us what you're looking for — bridal, gifting, or occasion wear?" },
      },
    },
  },
  {
    id: "wa-waba-text",
    label: "WhatsApp · WABA wrapper + text",
    channel: "whatsapp",
    json: {
      object: "whatsapp_business_account",
      entry: [{
        id: "WABA_ID",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: TYAANI_BUSINESS_WHATSAPP, phone_number_id: "123" },
            contacts: [{ profile: { name: "Riya" }, wa_id: "917275724262" }],
            messages: [{
              from: "917275724262",
              id: "wamid.HBgMOTE5MzQ4MDMzMzEwFQIAEhgUM0FCQ0RFRjAxMjM0NTY3ODk",
              wmaid: "wamid.HBgMOTE5MzQ4MDMzMzEwFQIAEhgUM0FCQ0RFRjAxMjM0NTY3ODk",
              timestamp: "1788490000",
              type: "text",
              text: { body: "pp" },
              referral: {
                source_type: "ad",
                source_id: "120247849538730570",
                headline: "100% off on making charges",
                body: "Selected pieces only, while stocks last.",
                media_type: "image",
                image_url: "https://tyaani.com/cdn/shop/files/sample.jpg",
              },
            }],
          },
          field: "messages",
        }],
      }],
    },
  },
  {
    id: "wa-image-ad",
    label: "WhatsApp · image + ad referral",
    channel: "whatsapp",
    json: {
      from: "917275724262",
      id: "wamid.HBgMOTE4NjAwNDE5NjU1FQIAEhggSU1BR0VSRUZBQkNERUYwMTI",
      wmaid: "wamid.HBgMOTE4NjAwNDE5NjU1FQIAEhggSU1BR0VSRUZBQkNERUYwMTI",
      timestamp: "1788496741",
      type: "image",
      image: { mime_type: "image/jpeg", caption: "Is this available?", id: "3597411143744285" },
      referral: {
        source_type: "ad",
        source_id: "120247849538730570",
        media_type: "image",
        headline: "Tyaani Polki",
        welcome_message: { text: "Welcome to Tyaani Jewellery by Karan Johar." },
      },
    },
  },
  {
    id: "ig-dm-ad",
    label: "Instagram · DM + ad click",
    channel: "instagram",
    json: {
      event: "InstagramWebhook.Received",
      event_type: "DM",
      data: {
        entry: [{
          id: "17841402094012164",
          messaging: [{
            sender: { id: "1065641026057986" },
            recipient: { id: "17841402094012164" },
            timestamp: 1788498695057,
            message: {
              mid: "aWdfSAMPLE",
              text: "I want to see some Jewellery designs.",
              referral: {
                source: "ADS",
                type: "OPEN_THREAD",
                ad_id: "120249909544060465",
                ads_context_data: {
                  ad_title: "rv-5.99%making-offer-video",
                  video_url: "https://www.facebook.com/ads/image/?d=sample",
                },
              },
            },
          }],
        }],
      },
    },
  },
  {
    id: "ig-comment-pp",
    label: "Instagram · ad comment “Pp”",
    channel: "instagram",
    json: {
      event: "InstagramWebhook.Received",
      event_type: "Comment",
      data: {
        entry: [{
          id: "17841450392110632",
          time: 1788499474,
          changes: [{
            value: {
              from: { id: "1585096443396827", username: "bittoo_chawla" },
              media: { id: "17992613076011056", media_product_type: "AD" },
              id: "18339009595265060",
              text: "Pp",
            },
            field: "comments",
          }],
        }],
        object: "instagram",
      },
    },
  },
  {
    id: "ig-echo",
    label: "Instagram · echo (no reply)",
    channel: "instagram",
    json: {
      event: "InstagramWebhook.Received",
      event_type: "DM",
      data: {
        object: "instagram",
        entry: [{
          id: "17841402094012164",
          messaging: [{
            sender: { id: "17841402094012164" },
            recipient: { id: "1065641026057986" },
            timestamp: 1788498695057,
            message: {
              mid: "aWdfECHO",
              text: "Thanks for writing in — this is our outbound echo.",
              is_echo: true,
            },
          }],
        }],
      },
    },
  },
  {
    id: "fb-text-ad",
    label: "Facebook · text + ad referral",
    channel: "facebook",
    json: {
      object: "page",
      entry: [{
        id: "PAGE_ID",
        messaging: [{
          sender: { id: "PSID_123", name: "Meera" },
          recipient: { id: "PAGE_ID" },
          timestamp: 1788498695057,
          message: {
            mid: "m_SAMPLE",
            text: "How much is this?",
            referral: {
              source: "ADS",
              type: "OPEN_THREAD",
              ad_id: "120247849538730570",
              ads_context_data: {
                ad_title: "Tyaani Website Conversions • 22K Polki Collection",
                photo_url: "https://tyaani.com/cdn/shop/files/sample.jpg",
              },
            },
          },
        }],
      }],
    },
  },
];

export function prettySample(sample) {
  return JSON.stringify(sample.json, null, 2);
}
