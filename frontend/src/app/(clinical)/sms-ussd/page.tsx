/**
 * Mettu Karl Referral Hospital — SMS & USSD Telecom Gateway (*907#).
 * Ultra-soft, responsive, and fully multilingual workstation for non-smartphone patient notifications
 * and live interactive USSD feature-phone simulation.
 * Driven 100% by the unified Header language selector (Afaan Oromoo, አማርኛ, English).
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Smartphone,
  MessageSquare,
  Send,
  Radio,
  Mail,
  FileText,
  Settings,
  CheckCircle2,
  AlertTriangle,
  X,
  Wifi,
  Server,
  Zap,
  Check,
  PhoneCall,
  Lock,
} from 'lucide-react';

interface SMSLog {
  id: number;
  recipient_phone: string;
  message_text: string;
  language: string;
  status: string;
  channel: string;
  created_at: string;
}

const SMS_DICT = {
  om: {
    pageTitle: "Ergaa Bilbilaa & USSD Gateway (*907#)",
    pageSubtitle: "Dhukkubsattoota bilbila ammayyaa hin qabneef beellama, dabaree OPD, qoricha fi kaffaltii Telebirr erguu",
    shortcode: "Koodii Gabaabaa: 907 / *907#",
    stat1Label: "Ergaa SMS Har'aa (Dispatched Today)",
    stat1Badge: "99.8% Gaheera",
    stat2Label: "Yeroo USSD Session (*907#)",
    stat2Badge: "Daqiiqaa 1.2 av.",
    stat3Label: "Gatiin Ergaa Tokkoo (Ethio Telecom Tariff)",
    stat3Badge: "Bulk MoH Rate",
    consoleTitle: "Konsolii Ergaa SMS Erguu (SMS Dispatcher)",
    scenarios: "1-Click Shaakala Salphaa (Scenarios):",
    scenarioQueue: "Waamicha OPD",
    scenarioRx: "Qoricha Faarmaasii",
    scenarioBill: "Nagahee Telebirr",
    scenarioApt: "Beellama Yaalaa",
    phoneLabel: "Lakkoofsa Bilbila Dhukkubsataa (Phone Number) *",
    templateLabel: "Gosa Ergaa (Template) *",
    tplQueue: "Waamicha Dabaree OPD (Queue Alert)",
    tplApt: "Beellama Yaalaa (Appointment Reminder)",
    tplRx: "Qorichi Qophaa'eera (Prescription Ready)",
    tplBill: "Nagahee Kaffaltii Telebirr (Payment Receipt)",
    tplLab: "Bu'aa Laaboraatorii (Lab Ready)",
    paramSection: "Odeeffannoo Ergaa Keessaa (Parameters)",
    tokenLabel: "Token Lakk.",
    roomLabel: "Kutaa (Room)",
    waitLabel: "Daq. Eeggannoo",
    doctorLabel: "Ogeessa Yaalaa",
    drugsLabel: "Maqaa Qorichaa",
    invoiceLabel: "Lakk. Nagahee",
    amountLabel: "Gatii (ETB)",
    sendBtn: "Ergaa SMS Ergi (Dispatch Shortcode 907)",
    sendingBtn: "Ergaa Ergaa Jira...",
    previewTitle: "Calaqqee Ergaa (Live Message Preview):",
    charUnit: "qubee",
    smsPartUnit: "SMS",
    previewNotice: "Ergaan kun afaan keessan filatameen qindeeffamee bilbila dhukkubsataatti ergama.",
    ussdTitle: "USSD *907# Simulator",
    ussdBadge: "Feature Phone (Bilbila Duudaa)",
    ussdNotice: "*907# bilbilaa, ykn lakkoofsa cuqaasaa dabaree, qoricha fi kaffaltii to'adhaa.",
    ussdDialBtn: "Dial *907# (Jalqabi)",
    ussdEndBtn: "Cufi (End)",
    ussdSendBtn: "Send",
    logTitle: "Galmee Ergaawwan SMS Ergamanii (Live SMS Audit Trail)",
    logSync: "Ethio Telecom Log Sync Active",
    colId: "ID",
    colPhone: "Bilbila",
    colContent: "Ergaa Barreeffame",
    colLang: "Afaan",
    colStatus: "Haala (Status)",
    colChannel: "Sarara",
    colTime: "Sa'aatii",
    toastSuccessTitle: "Ergaan SMS Milkaa'inaan Ergameera!",
    toastSuccessMsg: "Ergaan bilbila {phone} tti darbeera.",
  },
  am: {
    pageTitle: "የኤስኤምኤስ እና ዩኤስኤስዲ መተላለፊያ (*907#)",
    pageSubtitle: "ስማርትፎን ለሌላቸው ታካሚዎች የቀጠሮ፣ የኦፒዲ ተራ፣ የመድኃኒት እና የቴሌብር ክፍያ መልዕክቶችን ማስተላለፍ",
    shortcode: "አጭር ቁጥር: 907 / *907#",
    stat1Label: "የዛሬ የተላኩ መልዕክቶች (Dispatched Today)",
    stat1Badge: "99.8% ደርሷል",
    stat2Label: "የዩኤስኤስዲ ክፍለ-ጊዜ (*907#)",
    stat2Badge: "1.2 ደቂቃ አማካይ",
    stat3Label: "የአንድ መልዕክት ዋጋ (ኢትዮ ቴሌኮም)",
    stat3Badge: "የጤና ሚኒስቴር ተመን",
    consoleTitle: "የኤስኤምኤስ መልዕክት መላኪያ ኮንሶል (SMS Dispatcher)",
    scenarios: "በአንድ ጠቅታ የሙከራ ሁኔታዎች (Scenarios):",
    scenarioQueue: "የኦፒዲ ተራ ጥሪ",
    scenarioRx: "የፋርማሲ መድኃኒት",
    scenarioBill: "የቴሌብር ደረሰኝ",
    scenarioApt: "የቀጠሮ ማስታወሻ",
    phoneLabel: "የታካሚ ስልክ ቁጥር *",
    templateLabel: "የመልዕክት ዓይነት (Template) *",
    tplQueue: "የኦፒዲ ተራ ቁጥር ጥሪ (Queue Alert)",
    tplApt: "የቀጠሮ ማስታወሻ (Appointment Reminder)",
    tplRx: "የታዘዘው መድኃኒት ተዘጋጅቷል (Prescription Ready)",
    tplBill: "የቴሌብር ክፍያ ደረሰኝ (Payment Receipt)",
    tplLab: "የላቦራቶሪ ምርመራ ውጤት (Lab Ready)",
    paramSection: "የመልዕክት መለኪያዎች (Parameters)",
    tokenLabel: "የተራ ቁጥር",
    roomLabel: "የሕክምና ክፍል",
    waitLabel: "የጥበቃ ጊዜ (ደቂቃ)",
    doctorLabel: "ሐኪም",
    drugsLabel: "የታዘዘ መድኃኒት",
    invoiceLabel: "ደረሰኝ ቁጥር",
    amountLabel: "ዋጋ (ብር)",
    sendBtn: "ኤስኤምኤስ ላክ (Dispatch Shortcode 907)",
    sendingBtn: "በመላክ ላይ...",
    previewTitle: "የመልዕክት ቅድመ-እይታ (Live Message Preview):",
    charUnit: "ፊደላት",
    smsPartUnit: "ኤስኤምኤስ",
    previewNotice: "ይህ መልዕክት በመረጡት ቋንቋ ተዘጋጅቶ በቀጥታ ወደ ታካሚው ስልክ ይላካል።",
    ussdTitle: "የዩኤስኤስዲ *907# ሲሙሌተር",
    ussdBadge: "ተራ ስልክ (ፊቸር ፎን)",
    ussdNotice: "*907# በመደወል ወይም ቁጥሮችን በመጫን አገልግሎቶችን ይከታተሉ።",
    ussdDialBtn: "ይደውሉ *907# (ጀምር)",
    ussdEndBtn: "ዝጋ (End)",
    ussdSendBtn: "ላክ",
    logTitle: "የተላኩ ኤስኤምኤስ እና ዩኤስኤስዲ መዝገብ (Audit Trail)",
    logSync: "የቀጥታ ኢትዮ ቴሌኮም ምዝግብ ማስታወሻ",
    colId: "መለያ",
    colPhone: "ስልክ",
    colContent: "የመልዕክት ይዘት",
    colLang: "ቋንቋ",
    colStatus: "ሁኔታ (Status)",
    colChannel: "መስመር",
    colTime: "ሰዓት",
    toastSuccessTitle: "ኤስኤምኤስ በተሳካ ሁኔታ ተልኳል!",
    toastSuccessMsg: "መልዕክቱ ወደ {phone} ተላልፏል።",
  },
  en: {
    pageTitle: "SMS & USSD Telecom Gateway (*907#)",
    pageSubtitle: "SMS appointment alerts, OPD queue tokens, pharmacy pickup, and Telebirr receipts for feature-phone patients",
    shortcode: "Shortcode: 907 / *907#",
    stat1Label: "Dispatched Today (SMS)",
    stat1Badge: "99.8% Delivered",
    stat2Label: "USSD Sessions (*907#)",
    stat2Badge: "1.2 min avg",
    stat3Label: "Per-SMS Tariff (Ethio Telecom)",
    stat3Badge: "Bulk MoH Rate",
    consoleTitle: "SMS Message Dispatcher Console",
    scenarios: "1-Click Test Scenarios:",
    scenarioQueue: "OPD Queue Call",
    scenarioRx: "Pharmacy Pickup",
    scenarioBill: "Telebirr Receipt",
    scenarioApt: "Appointment Reminder",
    phoneLabel: "Patient Phone Number *",
    templateLabel: "Message Template *",
    tplQueue: "OPD Queue Call Alert",
    tplApt: "Clinical Appointment Reminder",
    tplRx: "Pharmacy Prescription Ready",
    tplBill: "Telebirr Payment Receipt",
    tplLab: "Laboratory Results Ready",
    paramSection: "Message Parameters",
    tokenLabel: "Token Number",
    roomLabel: "Clinic Room",
    waitLabel: "Estimated Wait (mins)",
    doctorLabel: "Clinician",
    drugsLabel: "Prescribed Drugs",
    invoiceLabel: "Invoice #",
    amountLabel: "Amount (ETB)",
    sendBtn: "Send Live SMS (Dispatch 907)",
    sendingBtn: "Sending SMS...",
    previewTitle: "Live Message Screen Preview:",
    charUnit: "characters",
    smsPartUnit: "SMS",
    previewNotice: "This message is formatted in your selected language and dispatched directly to the patient.",
    ussdTitle: "USSD *907# Simulator",
    ussdBadge: "Feature Phone (Nokia Style)",
    ussdNotice: "Dial *907# or press numbers to check tokens, prescriptions, and bills.",
    ussdDialBtn: "Dial *907# (Start)",
    ussdEndBtn: "End Call",
    ussdSendBtn: "Send",
    logTitle: "Dispatched Message Log (Audit Trail)",
    logSync: "Ethio Telecom Log Sync Active",
    colId: "ID",
    colPhone: "Phone",
    colContent: "Message Content",
    colLang: "Language",
    colStatus: "Status",
    colChannel: "Channel",
    colTime: "Time",
    toastSuccessTitle: "SMS Dispatched Successfully!",
    toastSuccessMsg: "Message sent to {phone}.",
  },
};

export default function SMSUSSDGatewayPage(): React.ReactElement {
  const { t, language } = useTranslation();

  const currentLang: 'om' | 'am' | 'en' =
    language === 'am' || language === 'om' ? language : 'en';
  const dict = SMS_DICT[currentLang];

  // SMS Form State
  const [recipientPhone, setRecipientPhone] = useState('+251 911 002 233');
  const [templateKey, setTemplateKey] = useState('queue_alert');
  const [paramToken, setParamToken] = useState('A-042');
  const [paramRoom, setParamRoom] = useState('OPD Room 04');
  const [paramWait, setParamWait] = useState('15');
  const [paramDoctor, setParamDoctor] = useState('Dr. Bekele Tadesse');
  const [paramDrugs, setParamDrugs] = useState('Amoxicillin 625mg, Paracetamol');
  const [paramInvoice, setParamInvoice] = useState('INV-2026-MKH-0192');
  const [paramAmount, setParamAmount] = useState('84.00');
  const [isSending, setIsSending] = useState(false);

  // SMS Log History State
  const [logs, setLogs] = useState<SMSLog[]>([
    {
      id: 101,
      recipient_phone: '+251 911 002 233',
      message_text: "Mettu Karl Hospital: Your token A-042 has been called. Please proceed to OPD Room 04. Est. wait: 15 mins.",
      language: 'en',
      status: 'SENT',
      channel: 'SMS (Shortcode 907)',
      created_at: '14:15:30',
    },
    {
      id: 102,
      recipient_phone: '+251 922 445 566',
      message_text: "Mettu Karl Hospital: Prescribed medications (Amlodipine 5mg) are ready at Central Pharmacy Counter 01.",
      language: 'en',
      status: 'SENT',
      channel: 'SMS (Shortcode 907)',
      created_at: '14:10:12',
    },
  ]);

  // USSD Interactive Simulator State
  const [ussdPhone, setUssdPhone] = useState('+251 911 002 233');
  const [ussdScreenText, setUssdScreenText] = useState(
    'Feature Phone (Nokia Style)\nDial *907# or click Dial to start...'
  );
  const [ussdSessionActive, setUssdSessionActive] = useState(false);
  const [ussdCurrentInput, setUssdCurrentInput] = useState('');
  const [ussdHistory, setUssdHistory] = useState<string[]>([]);

  // Update default screen text when language changes and session is idle
  useEffect(() => {
    if (!ussdSessionActive) {
      if (currentLang === 'am') {
        setUssdScreenText('ተራ ስልክ (ፊቸር ፎን)\n*907# ይደውሉ ወይም ጀምር ይጫኑ...');
      } else if (currentLang === 'en') {
        setUssdScreenText('Feature Phone (Nokia Style)\nDial *907# or click Dial to start...');
      } else {
        setUssdScreenText('Bilbila Duudaa (Feature Phone)\nUSSD *907# cuqaasaa ykn Jalqabi jedhaa...');
      }
    }
  }, [currentLang, ussdSessionActive]);

  // Compute live reactive message preview based on the header's current language
  const previewMessage = useMemo(() => {
    if (templateKey === 'queue_alert') {
      if (currentLang === 'am') {
        return `ሜቱ ካርል ሆስፒታል፡ የተራ ቁጥርዎ ${paramToken} ተጠርቷል። እባክዎ ወደ ${paramRoom} ይግቡ። የጥበቃ ጊዜ፡ ${paramWait} ደቂቃ።`;
      } else if (currentLang === 'en') {
        return `Mettu Karl Hospital: Your token ${paramToken} has been called. Please proceed to ${paramRoom}. Est. wait: ${paramWait} mins.`;
      }
      return `Hospitaala Mettu Karl: Lakkoofsi keessan ${paramToken} waamameera. Mee gara ${paramRoom} tti darbaa. Yeroo eeggannoo: daq. ${paramWait}.`;
    } else if (templateKey === 'appointment_reminder') {
      if (currentLang === 'am') {
        return `ሜቱ ካርል ሆስፒታል፡ ክቡር ታካሚ፣ ለ 2026-11-05 ሰዓት 09:30 ከዶ/ር ${paramDoctor} ጋር ያለዎትን ቀጠሮ እናስታውሳለን።`;
      } else if (currentLang === 'en') {
        return `Mettu Karl Hospital: Dear patient, reminder for your appointment on 2026-11-05 at 09:30 with ${paramDoctor}.`;
      }
      return `Hospitaala Mettu Karl: Kabajamoo dhukkubsataa, beellama keessan guyyaa 2026-11-05 sa'a 09:30 ogeessa ${paramDoctor} wajjin qabdan isin yaadachiifna.`;
    } else if (templateKey === 'prescription_ready') {
      if (currentLang === 'am') {
        return `ሜቱ ካርል ሆስፒታል፡ የታዘዘው መድኃኒት (${paramDrugs}) በሆስፒታሉ ፋርማሲ ተዘጋጅቷል። ደረሰኝዎን ይዘው ይውሰዱ።`;
      } else if (currentLang === 'en') {
        return `Mettu Karl Hospital: Prescribed medications (${paramDrugs}) are ready at Central Pharmacy Counter 01.`;
      }
      return `Hospitaala Mettu Karl: Qorichi ajajame (${paramDrugs}) Faarmaasii Hospitaalaa Kutaa 01 tti qophaa'eera.`;
    } else if (templateKey === 'payment_receipt') {
      if (currentLang === 'am') {
        return `ሜቱ ካርል ሆስፒታል፡ የቴሌብር ክፍያ ለደረሰኝ #${paramInvoice} ብር ${paramAmount} በተሳካ ሁኔታ ተፈጽሟል። 80% በማህበረሰብ አቀፍ ጤና መድህን ተሸፍኗል።`;
      } else if (currentLang === 'en') {
        return `Mettu Karl Hospital: Telebirr payment of ETB ${paramAmount} for #${paramInvoice} confirmed. CBHI 80% subsidy applied.`;
      }
      return `Hospitaala Mettu Karl: Kaffaltiin Telebirr Nagahee #${paramInvoice} Qarshii ${paramAmount} milkaa'inaan raawwatameera. CBHI 80% uwwifameera. Galatoomaa!`;
    } else {
      if (currentLang === 'am') {
        return `ሜቱ ካርል ሆስፒታል፡ የላቦራቶሪ ምርመራ ውጤትዎ ደርሷል። ወደ ሆስፒታል ይምጡ ወይም በታካሚ ፖርታል ይመልከቱ።`;
      } else if (currentLang === 'en') {
        return `Mettu Karl Hospital: Your laboratory test results are ready. Please visit the hospital or view in patient portal.`;
      }
      return `Hospitaala Mettu Karl: Bu'aan qorannoo laaboraatorii keessanii qophaa'eera. Gara hospitaalaa koottaa ykn portal irraa ilaalaa.`;
    }
  }, [templateKey, currentLang, paramToken, paramRoom, paramWait, paramDoctor, paramDrugs, paramInvoice, paramAmount]);

  // Soft key audio tone generator
  const playKeyTone = (freq = 440) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // ignore
    }
  };

  // Carrier Setup State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [carrierConfig, setCarrierConfig] = useState<any>(null);
  const [activeCarrierTab, setActiveCarrierTab] = useState<'twilio' | 'ethio_telecom' | 'android_gateway'>('twilio');

  // Form fields
  const [cfgTwilioSid, setCfgTwilioSid] = useState('');
  const [cfgTwilioToken, setCfgTwilioToken] = useState('');
  const [cfgTwilioFrom, setCfgTwilioFrom] = useState('');

  const [cfgEthioUrl, setCfgEthioUrl] = useState('');
  const [cfgEthioUser, setCfgEthioUser] = useState('mettu_karl');
  const [cfgEthioPwd, setCfgEthioPwd] = useState('');
  const [cfgEthioShortcode, setCfgEthioShortcode] = useState('907');

  const [cfgAndroidUrl, setCfgAndroidUrl] = useState('');
  const [cfgAndroidToken, setCfgAndroidToken] = useState('');

  // Live test ping state
  const [testPingPhone, setTestPingPhone] = useState('');
  const [testPingResult, setTestPingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const fetchGatewayConfig = async () => {
    try {
      const res = await apiClient.get('/sms/config');
      if (res.data) {
        setCarrierConfig(res.data);
        if (res.data.provider && ['twilio', 'ethio_telecom', 'android_gateway'].includes(res.data.provider)) {
          setActiveCarrierTab(res.data.provider as any);
        }
        if (res.data.twilio_from_number) setCfgTwilioFrom(res.data.twilio_from_number);
        if (res.data.ethio_url) setCfgEthioUrl(res.data.ethio_url);
        if (res.data.android_gateway_url) setCfgAndroidUrl(res.data.android_gateway_url);
      }
    } catch (e) {
      console.error('Failed to load carrier config:', e);
    }
  };

  useEffect(() => {
    fetchGatewayConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const payload: any = {
        provider: activeCarrierTab,
        is_active: true,
      };
      if (activeCarrierTab === 'twilio') {
        payload.twilio_account_sid = cfgTwilioSid;
        payload.twilio_auth_token = cfgTwilioToken;
        payload.twilio_from_number = cfgTwilioFrom;
      } else if (activeCarrierTab === 'ethio_telecom') {
        payload.ethio_url = cfgEthioUrl;
        payload.ethio_username = cfgEthioUser;
        payload.ethio_password = cfgEthioPwd;
        payload.ethio_shortcode = cfgEthioShortcode;
      } else if (activeCarrierTab === 'android_gateway') {
        payload.android_gateway_url = cfgAndroidUrl;
        payload.android_gateway_token = cfgAndroidToken;
      }

      const res = await apiClient.post('/sms/config', payload);
      setCarrierConfig(res.data);
      notifications.show({
        title: "Qindaa'inni Sararaa Milkaa'eera!",
        message: `Carrier ${activeCarrierTab.toUpperCase()} milkaa'inaan qindaa'eera.`,
        color: 'teal',
      });
    } catch (err: any) {
      notifications.show({
        title: "Dogoggora Qindaa'inaa",
        message: err.message || "Qindaa'ina olkaa'uun hin dandaamne.",
        color: 'red',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestPing = async () => {
    if (!testPingPhone) {
      notifications.show({
        title: "Lakkoofsa Bilbilaa Galchaa",
        message: "Mee lakkoofsa bilbila keessan galchaatii yaalaa.",
        color: 'amber',
      });
      return;
    }
    setIsTestingPing(true);
    setTestPingResult(null);
    try {
      const res = await apiClient.post('/sms/test-connection', {
        phone_number: testPingPhone,
        message: `Mettu Karl Hospital: Testing Live Carrier connection to ${testPingPhone}. Verification successful! *907#`,
      });
      setTestPingResult({
        success: res.data.success,
        message: res.data.carrier_message,
      });
      if (res.data.success) {
        notifications.show({
          title: "Ergaan Bilbila Keessan Qaqqabeera!",
          message: res.data.carrier_message,
          color: 'teal',
        });
      } else {
        notifications.show({
          title: "Carrier Response",
          message: res.data.carrier_message,
          color: 'amber',
          autoClose: 8000,
        });
      }
    } catch (err: any) {
      setTestPingResult({
        success: false,
        message: err.message || "Connection failed",
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  // Preset Scenario Loaders
  const loadScenario = (type: 'queue' | 'rx' | 'bill' | 'apt') => {
    if (type === 'queue') {
      setTemplateKey('queue_alert');
      setRecipientPhone('+251 911 002 233');
      setParamToken('A-042');
      setParamRoom('OPD Room 04');
      setParamWait('15');
    } else if (type === 'rx') {
      setTemplateKey('prescription_ready');
      setRecipientPhone('+251 922 445 566');
      setParamDrugs('Amoxicillin 625mg, Paracetamol 500mg');
    } else if (type === 'bill') {
      setTemplateKey('payment_receipt');
      setRecipientPhone('+251 911 002 233');
      setParamInvoice('INV-2026-MKH-0192');
      setParamAmount('84.00');
    } else {
      setTemplateKey('appointment_reminder');
      setRecipientPhone('+251 922 445 566');
      setParamDoctor('Dr. Bekele Tadesse');
    }
  };

  // Dispatch Live SMS Action
  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const params: Record<string, string> = {};
    if (templateKey === 'queue_alert') {
      params.token = paramToken;
      params.room = paramRoom;
      params.wait_mins = paramWait;
    } else if (templateKey === 'appointment_reminder') {
      params.date = '2026-11-05';
      params.time = '09:30';
      params.doctor = paramDoctor;
    } else if (templateKey === 'prescription_ready') {
      params.drugs = paramDrugs;
    } else if (templateKey === 'payment_receipt') {
      params.invoice_no = paramInvoice;
      params.amount = paramAmount;
    }

    try {
      const res = await apiClient.post('/sms/send', {
        phone_number: recipientPhone,
        template_key: templateKey,
        language: currentLang,
        parameters: params,
      });

      const isDelivered = res.data?.is_carrier_delivered;
      const carrierNote = res.data?.carrier_note || res.data?.error_message;

      const newLog: SMSLog = {
        id: res.data?.id || Date.now(),
        recipient_phone: recipientPhone,
        message_text: res.data?.message_text || previewMessage,
        language: currentLang,
        status: isDelivered ? 'SENT (LIVE CARRIER)' : 'SENT (SIMULATED AUDIT)',
        channel: isDelivered ? 'Live Ethio Telecom / Twilio' : 'SMS (*907# Sim)',
        created_at: new Date().toLocaleTimeString(),
      };

      setLogs((prev) => [newLog, ...prev]);

      if (isDelivered) {
        notifications.show({
          title: "Ergaan SMS Milkaa'inaan Ergameera!",
          message: `Ergaan bilbila ${recipientPhone} irratti sarara bilbilaa dhugaatiin ergameera.`,
          color: 'teal',
        });
      } else {
        notifications.show({
          title: "Galmee Keessootti Qabameera (Simulated Audit)",
          message: `Ergaan bilbila ${recipientPhone} sirna database keessatti qabameera. Bilbila dhugaatti erguuf credential Ethio Telecom ykn Twilio .env irratti qindeessuun barbaachisaadha.`,
          color: 'amber',
          autoClose: 9000,
        });
      }
    } catch {
      const newLog: SMSLog = {
        id: Date.now(),
        recipient_phone: recipientPhone,
        message_text: previewMessage,
        language: currentLang,
        status: 'SENT (OFFLINE AUDIT)',
        channel: 'SMS (Shortcode 907)',
        created_at: new Date().toLocaleTimeString(),
      };
      setLogs((prev) => [newLog, ...prev]);

      notifications.show({
        title: "Galmee Keessoo (Audit Logged)",
        message: `Ergaan bilbila ${recipientPhone} sirna keessatti qabameera (Simulated).`,
        color: 'amber',
        autoClose: 7000,
      });
    } finally {
      setIsSending(false);
    }
  };

  // USSD Dial Action
  const handleDialUSSD = async (navChoice?: string) => {
    playKeyTone(600);
    let nextText = '';
    if (navChoice !== undefined) {
      nextText = ussdHistory.length > 0 ? `${ussdHistory.join('*')}*${navChoice}` : navChoice;
    } else if (!ussdSessionActive) {
      nextText = '';
    } else {
      nextText = ussdCurrentInput.trim();
    }

    try {
      const res = await apiClient.post('/sms/ussd', {
        session_id: 'USSD-SIM-001',
        phone_number: ussdPhone,
        service_code: '*907#',
        text: nextText,
        language: currentLang,
      });

      const responseString: string = res.data.response || '';
      setUssdScreenText(responseString.replace('CON ', '').replace('END ', ''));
      if (responseString.startsWith('END')) {
        setUssdSessionActive(false);
        setUssdHistory([]);
      } else {
        setUssdSessionActive(true);
        if (navChoice !== undefined) {
          setUssdHistory((prev) => [...prev, navChoice]);
        }
      }
      setUssdCurrentInput('');
    } catch {
      // Localized client simulation
      if (navChoice === '1') {
        if (currentLang === 'am') {
          setUssdScreenText('የኦፒዲ ተራ ቁጥር ክትትል:\nየእርስዎ ተራ: A-042\nክፍል: OPD Kutaa 04\nየጥበቃ ጊዜ: 15 ደቂቃ\nበመታከም ላይ ያለ: A-040');
        } else if (currentLang === 'en') {
          setUssdScreenText('OPD Queue Token Status:\nYour Token: A-042\nClinic Room: OPD Room 04\nEst Wait: 15 mins\nCurrently Serving: A-040');
        } else {
          setUssdScreenText('Dabaree OPD:\nToken Keessan: A-042\nKutaa: OPD Kutaa 04\nYeroo Eeggannoo: daq. 15\nAmma Kan Yaalamu: A-040');
        }
        setUssdSessionActive(false);
      } else if (navChoice === '2') {
        if (currentLang === 'am') {
          setUssdScreenText('የታዘዘ መድኃኒት:\nAmoxicillin 625mg (3x10)\nሁኔታ: በማዕከላዊ ፋርማሲ ተዘጋጅቷል');
        } else if (currentLang === 'en') {
          setUssdScreenText('My Prescriptions:\nAmoxicillin 625mg (3x10)\nStatus: Ready at Central Pharmacy Counter 01');
        } else {
          setUssdScreenText('Qoricha Keessan:\nAmoxicillin 625mg (3x10)\nHaala: Faarmaasii Kutaa 01 tti Qophaa\'eera');
        }
        setUssdSessionActive(false);
      } else if (navChoice === '3') {
        if (currentLang === 'am') {
          setUssdScreenText('የሕክምና ሂሳብ:\nደረሰኝ: INV-2026-MKH-0192\nየማህበረሰብ ጤና መድህን: 80% ተሸፍኗል\nየሚከፈል: 84.00 ብር\nበቴሌብር *127# ይክፈሉ');
        } else if (currentLang === 'en') {
          setUssdScreenText('Hospital Billing:\nInvoice: INV-2026-MKH-0192\nCBHI Subsidy: 80% applied\nPayable: ETB 84.00\nPay via Telebirr *127#');
        } else {
          setUssdScreenText('Herrega Hospitaalaa:\nNagahee: INV-2026-MKH-0192\nCBHI Uwwisa: 80% Uwwifame\nKaffalamu: Qar. 84.00\nTelebirr *127# tiin kaffalaa');
        }
        setUssdSessionActive(false);
      } else if (navChoice === '4') {
        if (currentLang === 'am') {
          setUssdScreenText('የቀጠሮ ሰዓት:\nቀን: 2026-11-05 ሰዓት 09:30 ጠዋት\nክፍል: የውስጥ ደዌ\nሐኪም: ዶ/ር በቀለ ታደሰ');
        } else if (currentLang === 'en') {
          setUssdScreenText('Clinical Appointment:\nDate: 2026-11-05 at 09:30 AM\nClinic: Internal Medicine OPD\nClinician: Dr. Bekele Tadesse');
        } else {
          setUssdScreenText('Beellama Yaalaa:\nGuyyaa: 2026-11-05 sa\'a 09:30 Ganama\nKutaa: OPD Yaala Keessaa\nOgeessa: Dr. Bekele Tadesse');
        }
        setUssdSessionActive(false);
      } else {
        if (currentLang === 'am') {
          setUssdScreenText('ወደ ሜቱ ካርል ሆስፒታል በደህና መጡ (*907#):\n1. የኦፒዲ ተራ ቁጥር\n2. መድኃኒት ማረጋገጫ\n3. ክፍያ እና ቴሌብር\n4. የቀጠሮ ሰዓት');
        } else if (currentLang === 'en') {
          setUssdScreenText('Welcome to Mettu Karl Hospital (*907#):\n1. OPD Queue Status\n2. My Prescriptions\n3. Billing & Telebirr\n4. Appointment Schedule');
        } else {
          setUssdScreenText('Baga Nagaan Dhuftan Hospitaala Karl Mettuu (*907#):\n1. Dabaree OPD\n2. Qoricha Koo\n3. Herrega & Telebirr\n4. Beellama Yaalaa');
        }
        setUssdSessionActive(true);
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    playKeyTone(700);
    setUssdCurrentInput((prev) => prev + val);
  };

  const handleCancelUSSD = () => {
    playKeyTone(300);
    setUssdSessionActive(false);
    setUssdCurrentInput('');
    setUssdHistory([]);
    if (currentLang === 'am') {
      setUssdScreenText('ጥሪ ተቋርጧል።\n*907# በመደወል እንደገና ይሞክሩ።');
    } else if (currentLang === 'en') {
      setUssdScreenText('Session Ended.\nDial *907# to start a new session.');
    } else {
      setUssdScreenText('Tajaajilli Cufameera.\n*907# bilbiluun irra deebi\'aa yaalaa.');
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={['doctor', 'nurse', 'receptionist', 'billing', 'pharmacist', 'admin', 'super_admin']}
      moduleName="SMS & USSD Gateway"
      category="administrative"
    >
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
            <div className="space-y-6 pb-12">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 px-6 py-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-500 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {dict.pageTitle}
                      </h1>
                      <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Ethio Telecom Live SMS
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {dict.pageSubtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition shadow-sm cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-amber-400" />
                    <span>Qindaa'ina Sararaa (Carrier Setup)</span>
                    {carrierConfig?.is_configured ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                  <div className="rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/40 px-3.5 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
                    {dict.shortcode}
                  </div>
                </div>
              </div>

              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {dict.stat1Label}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">1,480</span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                      {dict.stat1Badge}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {dict.stat2Label}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">824</span>
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                      {dict.stat2Badge}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-[#222b3d] bg-white dark:bg-[#131824] p-5 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {dict.stat3Label}
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">0.15 ETB</span>
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md">
                      {dict.stat3Badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-Column Layout: SMS Console Left, Retro USSD Phone Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Column 1: SMS Console (7 cols) */}
                <div className="lg:col-span-7 rounded-[28px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-teal-400" />
                      <h2 className="text-base sm:text-lg font-black text-slate-900">
                        {dict.consoleTitle}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Ethio Telecom REST Gateway</span>
                  </div>

                  {/* Telecom Integration Notice */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <Radio className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-300">Hubachiisa Sarara Bilbilaa (Live Carrier Status):</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200/90">
                        Ergaan kun bilbila keessan irratti kallattiin akka gahuuf, credential <strong>Ethio Telecom Bulk SMS API</strong> ykn <strong>Twilio</strong> faayilii <code>backend/.env</code> keessatti qindeessuun barbaachisaadha. Yoo credential hin qindeessine ta'e, ergaan sirna keessoo hospitaalaa (Database Audit Trail) qofatti qabama.
                      </p>
                    </div>
                  </div>

                  {/* Quick 1-Click Scenario Loaders */}
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {dict.scenarios}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => loadScenario('queue')}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-left hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-900 text-[11px]">{dict.scenarioQueue}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Token A-042</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loadScenario('rx')}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-left hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-900 text-[11px]">{dict.scenarioRx}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Amoxicillin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loadScenario('bill')}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-left hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-900 text-[11px]">{dict.scenarioBill}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ETB 84.00</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loadScenario('apt')}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-left hover:border-teal-400 hover:bg-teal-50/40 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-900 text-[11px]">{dict.scenarioApt}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Nov 05</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSendSMS} className="space-y-4">
                    {/* Recipient Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {dict.phoneLabel}
                      </label>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+251 911 002 233"
                        required
                        className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xs focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition"
                      />
                    </div>

                    {/* Template Selection - Clean, Full-Width (middle language switcher removed!) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {dict.templateLabel}
                      </label>
                      <select
                        value={templateKey}
                        onChange={(e) => setTemplateKey(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition"
                      >
                        <option value="queue_alert">{dict.tplQueue}</option>
                        <option value="appointment_reminder">{dict.tplApt}</option>
                        <option value="prescription_ready">{dict.tplRx}</option>
                        <option value="payment_receipt">{dict.tplBill}</option>
                        <option value="lab_ready">{dict.tplLab}</option>
                      </select>
                    </div>

                    {/* Dynamic Context Parameters */}
                    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-3">
                      <span className="block text-xs font-bold uppercase tracking-wider text-teal-900">
                        {dict.paramSection}
                      </span>

                      {templateKey === 'queue_alert' && (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.tokenLabel}</label>
                            <input
                              type="text"
                              value={paramToken}
                              onChange={(e) => setParamToken(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.roomLabel}</label>
                            <input
                              type="text"
                              value={paramRoom}
                              onChange={(e) => setParamRoom(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.waitLabel}</label>
                            <input
                              type="text"
                              value={paramWait}
                              onChange={(e) => setParamWait(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {templateKey === 'prescription_ready' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.drugsLabel}</label>
                          <input
                            type="text"
                            value={paramDrugs}
                            onChange={(e) => setParamDrugs(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                          />
                        </div>
                      )}

                      {templateKey === 'payment_receipt' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.invoiceLabel}</label>
                            <input
                              type="text"
                              value={paramInvoice}
                              onChange={(e) => setParamInvoice(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.amountLabel}</label>
                            <input
                              type="text"
                              value={paramAmount}
                              onChange={(e) => setParamAmount(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {templateKey === 'appointment_reminder' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">{dict.doctorLabel}</label>
                          <input
                            type="text"
                            value={paramDoctor}
                            onChange={(e) => setParamDoctor(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* Reactive Live Message Balloon Preview */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-teal-400" /> {dict.previewTitle}</span>
                        <span>{previewMessage.length} {dict.charUnit} / 1 {dict.smsPartUnit}</span>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs font-medium text-slate-800 shadow-2xs leading-relaxed">
                        {previewMessage}
                      </div>
                      <p className="text-[10px] text-teal-800 font-semibold">
                        {dict.previewNotice}
                      </p>
                    </div>

                    {/* Submit Dispatch */}
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
                    >
                      <Send className="h-4 w-4 inline mr-1" />
                      <span>{isSending ? dict.sendingBtn : dict.sendBtn}</span>
                    </button>
                  </form>
                </div>

                {/* Column 2: Retro USSD Feature Phone Simulator (5 cols) */}
                <div className="lg:col-span-5 rounded-[28px] border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 sm:p-6 shadow-xl text-white space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="h-5 w-5 text-teal-400" />
                      <div>
                        <h3 className="text-sm font-black text-white">{dict.ussdTitle}</h3>
                        <span className="text-[10px] text-teal-400 font-mono font-bold">{dict.ussdBadge}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                      *907#
                    </span>
                  </div>

                  {/* LCD Screen representation */}
                  <div className="rounded-2xl border-4 border-slate-700 bg-[#7c9d8b] p-4 text-slate-950 font-mono text-xs shadow-inner min-h-[160px] flex flex-col justify-between">
                    <div className="whitespace-pre-line leading-relaxed font-bold">
                      {ussdScreenText}
                    </div>
                    {ussdSessionActive && (
                      <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black text-slate-800">Choice:</span>
                        <input
                          type="text"
                          value={ussdCurrentInput}
                          onChange={(e) => setUssdCurrentInput(e.target.value)}
                          placeholder="1-4"
                          maxLength={3}
                          className="w-16 rounded bg-white/90 border border-slate-800/60 px-1.5 py-0.5 text-center font-bold text-slate-950 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleDialUSSD(ussdCurrentInput)}
                          className="bg-slate-950 text-white px-2.5 py-0.5 rounded text-[10px] font-black cursor-pointer"
                        >
                          {dict.ussdSendBtn}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick 1-Click Interactive USSD Action Buttons */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {dict.ussdNotice}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleDialUSSD('1')}
                        className="rounded-xl border border-slate-800 bg-slate-800/70 p-2 text-left hover:bg-slate-700 hover:border-teal-400 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-300">1. {currentLang === 'am' ? 'የኦፒዲ ተራ' : currentLang === 'en' ? 'OPD Queue' : 'Dabaree OPD'}</span>
                        <span className="text-[10px] text-slate-400">Token & wait</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDialUSSD('2')}
                        className="rounded-xl border border-slate-800 bg-slate-800/70 p-2 text-left hover:bg-slate-700 hover:border-teal-400 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-300">2. {currentLang === 'am' ? 'መድኃኒት' : currentLang === 'en' ? 'Prescription' : 'Qoricha Koo'}</span>
                        <span className="text-[10px] text-slate-400">Dispense check</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDialUSSD('3')}
                        className="rounded-xl border border-slate-800 bg-slate-800/70 p-2 text-left hover:bg-slate-700 hover:border-teal-400 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-300">3. {currentLang === 'am' ? 'ክፍያና ቴሌብር' : currentLang === 'en' ? 'Billing' : 'Herrega & Telebirr'}</span>
                        <span className="text-[10px] text-slate-400">Bill & CBHI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDialUSSD('4')}
                        className="rounded-xl border border-slate-800 bg-slate-800/70 p-2 text-left hover:bg-slate-700 hover:border-teal-400 transition cursor-pointer"
                      >
                        <span className="block font-bold text-teal-300">4. {currentLang === 'am' ? 'ቀጠሮ' : currentLang === 'en' ? 'Appointment' : 'Beellama Yaalaa'}</span>
                        <span className="text-[10px] text-slate-400">Clinic follow-up</span>
                      </button>
                    </div>
                  </div>

                  {/* Tactile Keypad */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleKeypadPress(k)}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-black text-slate-200 border border-slate-700 active:scale-95 transition cursor-pointer"
                      >
                        {k}
                      </button>
                    ))}
                  </div>

                  {/* USSD Keypad Controls */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDialUSSD()}
                      className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-black text-white shadow transition cursor-pointer"
                    >
                      {dict.ussdDialBtn}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelUSSD}
                      className="rounded-2xl border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/60 px-4 py-3 text-xs font-bold text-rose-300 transition cursor-pointer"
                    >
                      {dict.ussdEndBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time SMS Audit Trail Table */}
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-400" />
                    <h3 className="text-base font-black text-slate-900">
                      {dict.logTitle}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {dict.logSync}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">{dict.colId}</th>
                        <th className="py-2.5 px-3">{dict.colPhone}</th>
                        <th className="py-2.5 px-3">{dict.colContent}</th>
                        <th className="py-2.5 px-3">{dict.colLang}</th>
                        <th className="py-2.5 px-3">{dict.colStatus}</th>
                        <th className="py-2.5 px-3">{dict.colChannel}</th>
                        <th className="py-2.5 px-3">{dict.colTime}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">#{log.id}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{log.recipient_phone}</td>
                          <td className="py-3 px-3 text-slate-800 max-w-md">{log.message_text}</td>
                          <td className="py-3 px-3 font-bold text-slate-600 uppercase">{log.language}</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-semibold">{log.channel}</td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{log.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CARRIER CONFIGURATION MODAL */}
            {isConfigModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
                <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1e293b] bg-slate-50 dark:bg-[#101726]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                        <Settings className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Qindaa'ina Sarara Moobaayilaa (SMS Carrier Setup)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Ergaan bilbila dhugaa irratti akka gahuuf sarara telecom filadhaa
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsConfigModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Active Status Banner */}
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#070a0f] border border-slate-200 dark:border-[#1e293b] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Radio className={`h-4 w-4 ${carrierConfig?.is_configured ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Haala Sarara Ammaa (Current Status):</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {carrierConfig?.status_summary || 'Checking configuration...'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        carrierConfig?.is_configured
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {carrierConfig?.is_configured ? 'Active Carrier' : 'Simulated'}
                      </span>
                    </div>

                    {/* Carrier Provider Tabs */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#070a0f] rounded-xl border border-slate-200 dark:border-[#1e293b]">
                      <button
                        type="button"
                        onClick={() => setActiveCarrierTab('twilio')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          activeCarrierTab === 'twilio'
                            ? 'bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Twilio (Global)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCarrierTab('ethio_telecom')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          activeCarrierTab === 'ethio_telecom'
                            ? 'bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Server className="h-3.5 w-3.5" />
                        Ethio Telecom
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCarrierTab('android_gateway')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          activeCarrierTab === 'android_gateway'
                            ? 'bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        Android GSM SIM
                      </button>
                    </div>

                    {/* Provider Forms */}
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                      {activeCarrierTab === 'twilio' && (
                        <div className="space-y-3.5 p-4 rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-slate-50/50 dark:bg-[#101726]/50">
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <strong>Twilio:</strong> Bilbila Itoophiyaa (+251 9... ykn +251 7...) hundaaf daqiiqaa muraasa keessatti ergaa dhugaa erga.
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Twilio Account SID *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              value={cfgTwilioSid}
                              onChange={(e) => setCfgTwilioSid(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Twilio Auth Token *
                            </label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••••••••••••••••••••••••••"
                              value={cfgTwilioToken}
                              onChange={(e) => setCfgTwilioToken(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Twilio Phone Number (From) *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="+1234567890"
                              value={cfgTwilioFrom}
                              onChange={(e) => setCfgTwilioFrom(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}

                      {activeCarrierTab === 'ethio_telecom' && (
                        <div className="space-y-3.5 p-4 rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-slate-50/50 dark:bg-[#101726]/50">
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <strong>Ethio Telecom:</strong> Sarara Bulk SMS biyyaalessaa koodii gabaabaa <strong>907</strong> wajjin walqabatu.
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Ethio Telecom API URL *
                            </label>
                            <input
                              type="url"
                              required
                              placeholder="https://sms.ethiotelecom.et/api/v1/send"
                              value={cfgEthioUrl}
                              onChange={(e) => setCfgEthioUrl(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Username *
                              </label>
                              <input
                                type="text"
                                required
                                value={cfgEthioUser}
                                onChange={(e) => setCfgEthioUser(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Password *
                              </label>
                              <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={cfgEthioPwd}
                                onChange={(e) => setCfgEthioPwd(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Sender Shortcode
                            </label>
                            <input
                              type="text"
                              value={cfgEthioShortcode}
                              onChange={(e) => setCfgEthioShortcode(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}

                      {activeCarrierTab === 'android_gateway' && (
                        <div className="space-y-3.5 p-4 rounded-2xl border border-slate-200 dark:border-[#1e293b] bg-slate-50/50 dark:bg-[#101726]/50">
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <strong>Android GSM SIM Gateway:</strong> Bilbila Android kamiyyuu Ethio Telecom SIM qabu fayyadamuun kaffaltii API tokko malee kaardii bilbilaa baratameen (0.15 ETB) ergaa dhugaa erga. App <em>'Android SMS Gateway'</em> Google Play irraa buufadhaatii Wi-Fi IP as galchaa.
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Android Local Wi-Fi Gateway URL *
                            </label>
                            <input
                              type="url"
                              required
                              placeholder="http://192.168.1.50:8080/message"
                              value={cfgAndroidUrl}
                              onChange={(e) => setCfgAndroidUrl(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Access Token (Optional)
                            </label>
                            <input
                              type="password"
                              placeholder="Token yoo qabaate..."
                              value={cfgAndroidToken}
                              onChange={(e) => setCfgAndroidToken(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={isSavingConfig}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
                        >
                          {isSavingConfig ? 'Olkaa\'aa jira...' : 'Qindaa\'ina Olkaa\'i (Save Settings)'}
                        </button>
                      </div>
                    </form>

                    {/* LIVE CONNECTION TEST SECTION */}
                    <div className="pt-4 border-t border-slate-200 dark:border-[#1e293b] space-y-3">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Qorannoo Ergaa Dhugaa (Live Handset Ping Test)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Lakkoofsa bilbila keessan galchaatii 'Ergaa Qorannoo Ergi' cuqaasaa. Ergaan kallattiin bilbila keessan qaqqabuu isaa mirkaneeffadhaa:
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          placeholder="Fkn: 0911223344 ykn +251911223344"
                          value={testPingPhone}
                          onChange={(e) => setTestPingPhone(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#070a0f] border border-slate-300 dark:border-[#1e293b] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleTestPing}
                          disabled={isTestingPing}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 flex-shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isTestingPing ? 'Ergaa jira...' : 'Ergaa Qorannoo Ergi'}
                        </button>
                      </div>

                      {testPingResult && (
                        <div className={`p-3 rounded-xl border text-xs ${
                          testPingResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        }`}>
                          <p className="font-bold flex items-center gap-1.5">
                            {testPingResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            {testPingResult.success ? 'Ergaan Milkaa\'inaan Gaheera!' : 'Carrier Response:'}
                          </p>
                          <p className="mt-1 text-[11px] font-mono leading-relaxed">{testPingResult.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
