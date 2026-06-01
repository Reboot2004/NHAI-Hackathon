export type Language = 'en' | 'hi';

export const TRANSLATIONS = {
  en: {
    appName: "DATALAKE 3.0",
    appSubName: "SECURE OFFLINE BIOMETRIC GATEWAY",
    orgName: "National Highways Authority of India",
    orgNameHindi: "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण",
    welcomeTitle: "BIOMETRIC ATTENDANCE SYSTEM",
    welcomeSub: "Offline Face Scan Portal",
    
    // Status & Pill Labels
    online: "ONLINE",
    offlineMode: "OFFLINE MODE",
    enrolledCount: "{count} REGISTERED",
    pendingSync: "{count} PENDING SYNC",
    zeroNetworkResilience: "Zero-Network Resilience",
    zeroNetworkDesc: "Fully operational with no internet. Attendance records are saved locally and auto-sync when network is available.",
    noPersonnelEnrolled: "No Personnel Registered",
    noPersonnelDesc: "Please register a face biometric before taking attendance. Supervisor PIN is required.",
    supervisorPinHint: "Supervisor PIN: 8890",
    
    // Buttons
    btnAuthenticate: "START BIOMETRIC ATTENDANCE",
    btnEnroll: "REGISTER NEW FACE",
    btnDashboard: "VIEW SYSTEM LOGS",
    btnBack: "BACK",
    btnCancel: "CANCEL",
    btnHome: "HOME",
    btnSubmit: "SUBMIT",
    btnRetry: "RETRY SCAN",
    btnNextVerification: "NEXT ATTENDANCE",
    
    // PIN Lock Screen
    gateTitle: "SUPERVISOR GATEWAY",
    gateSub: "Supervisor PIN is required to register new personnel credentials.",
    pinHintText: "Enter PIN (Default: 8890)",
    accessDenied: "Access Denied",
    invalidPinMsg: "Invalid Supervisor PIN. Please try again.",
    dotClear: "CLEAR",
    
    // Registration Form
    regHeader: "PERSONNEL REGISTRATION",
    regSub: "Enter official credentials to compile biometric record",
    fieldFullName: "FULL NAME (AS IN AADHAAR)",
    fieldFullNamePlaceholder: "e.g. Rajesh Kumar",
    fieldEmpId: "EMPLOYEE ID (E.G. NHAI-1234)",
    fieldEmpIdPlaceholder: "e.g. NHAI-2026-09",
    fieldRole: "ROLE / DESIGNATION",
    fieldRolePlaceholder: "e.g. Supervisor, Worker",
    fieldDept: "SECTOR / DEPARTMENT",
    fieldDeptPlaceholder: "e.g. NH-2 Zone 4",
    scanRegistryBoxTitle: "Face Biometric Enrollment",
    scanRegistryBoxDesc: "Camera access is required. Frame face in target boundary to record geometric measurements.",
    btnStartScan: "START CAMERA SCAN",
    btnReScan: "RE-RUN CAMERA SCAN",
    formIncompleteTitle: "Missing Information",
    formIncompleteMsg: "Please enter Name and Employee ID first.",
    cameraPermissionTitle: "Camera Required",
    cameraPermissionMsg: "Camera permission is needed for biometric registration.",
    biometricRequiredTitle: "Biometrics Required",
    biometricRequiredMsg: "Please complete the face camera scan before registering.",
    regSuccessTitle: "Registration Complete",
    regSuccessMsg: "Employee registered in the secure offline database.",
    
    // Camera Verification
    alignFace: "Align face inside circle and look directly at screen",
    capturing: "Capturing frame...",
    extractingKeypoints: "Processing facial features...",
    captureBtnLabel: "CAPTURE PHOTO",
    aligningReticle: "ALIGNING RETICLE...",
    faceNotDetectedTitle: "Face Not Found",
    faceNotDetectedMsg: "No face detected in the frame. Please look straight at the camera and try again.",
    
    // Liveness Challenges
    livenessSuccessText: "Liveness check verified",
    livenessTitle: "LIVENESS VALIDATION",
    challengeSmile: "Please smile",
    challengeBlink: "Please blink your eyes",
    challengeTurnLeft: "Please turn your head left",
    challengeTurnRight: "Please turn your head right",
    challengeFailedTitle: "Liveness Failed",
    challengeFailedMsg: "Could not verify motion. Please follow the prompt and try again.",
    comparingFace: "Comparing face features offline...",
    
    // Result Screens
    verifiedTitle: "ATTENDANCE VERIFIED",
    verifiedSub: "Identity successfully verified offline",
    recordSavedNotice: "Record queued offline for synchronization",
    deniedTitle: "VERIFICATION FAILED",
    deniedSub: "Biometric match score below threshold",
    deniedDesc: "The face scan did not match the registered profile. Ensure proper lighting and look directly at the screen.",
    matchLabel: "MATCH SCORE",
    inferenceLabel: "SPEED",
    modelLabel: "AI MODEL",
    livenessLabel: "LIVENESS",
    
    // Dashboard & Logs
    dbTitle: "OFFLINE DATABASE CONSOLE",
    dbLogsSection: "OFFLINE SYNC QUEUE",
    dbActionsSection: "SYSTEM MANAGEMENT PANEL",
    dbToggleNet: "TOGGLE NETWORK STATE",
    dbForceSync: "FORCE SYNC TO CLOUD",
    dbResetDB: "RESET DATABASE",
    dbSystemConsole: "EDGE AUDIT TELEMETRY",
    dbLogsPlaceholder: "No offline logs. Database synced.",
    dbClearLogs: "Wipe & Sync complete",
    dbOnlineActive: "Cloud API Active",
    dbOfflineActive: "Local Enclave Buffered",
    
    // Demo Mismatch Switch
    simulateMismatchLabel: "SIMULATE UNREGISTERED USER (FAIL MATCH)",
    mismatchActiveBtn: "MATCH WILL FAIL",
    mismatchInactiveBtn: "MATCH NORMAL",
  },
  hi: {
    appName: "डेटालेक 3.0",
    appSubName: "सुरक्षित ऑफ़लाइन बायोमेट्रिक गेटवे",
    orgName: "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण",
    orgNameHindi: "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण",
    welcomeTitle: "बायोमेट्रिक उपस्थिति प्रणाली",
    welcomeSub: "ऑफ़लाइन चेहरा स्कैन पोर्टल",
    
    // Status & Pill Labels
    online: "सक्रिय नेटवर्क",
    offlineMode: "ऑफलाइन मोड",
    enrolledCount: "{count} पंजीकृत कर्मचारी",
    pendingSync: "{count} लंबित सिंक",
    zeroNetworkResilience: "बिना नेटवर्क काम करने की क्षमता",
    zeroNetworkDesc: "इंटरनेट न होने पर भी पूरी तरह कार्यरत। उपस्थिति रिकॉर्ड फोन में सुरक्षित रहते हैं और नेटवर्क मिलने पर अपने आप सिंक हो जाते हैं।",
    noPersonnelEnrolled: "कोई कर्मचारी पंजीकृत नहीं है",
    noPersonnelDesc: "उपस्थिति लेने से पहले कृपया अपना चेहरा पंजीकृत करें। पर्यवेक्षक (Supervisor) पिन की आवश्यकता है।",
    supervisorPinHint: "पर्यवेक्षक पिन: 8890",
    
    // Buttons
    btnAuthenticate: "बायोमेट्रिक उपस्थिति शुरू करें",
    btnEnroll: "नया चेहरा पंजीकृत करें",
    btnDashboard: "सिस्टम लॉग देखें",
    btnBack: "वापस जाएं",
    btnCancel: "रद्द करें",
    btnHome: "होम",
    btnSubmit: "जमा करें",
    btnRetry: "दोबारा प्रयास करें",
    btnNextVerification: "अगली उपस्थिति",
    
    // PIN Lock Screen
    gateTitle: "पर्यवेक्षक प्रवेश द्वार",
    gateSub: "नया चेहरा पंजीकृत करने के लिए पर्यवेक्षक (Supervisor) का पिन आवश्यक है।",
    pinHintText: "पिन दर्ज करें (डिफ़ॉल्ट: 8890)",
    accessDenied: "प्रवेश वर्जित",
    invalidPinMsg: "गलत पर्यवेक्षक पिन। कृपया पुनः प्रयास करें।",
    dotClear: "साफ़ करें",
    
    // Registration Form
    regHeader: "कर्मचारी पंजीकरण",
    regSub: "बायोमेट्रिक रिकॉर्ड बनाने के लिए आधिकारिक विवरण दर्ज करें",
    fieldFullName: "पूरा नाम (आधार के अनुसार)",
    fieldFullNamePlaceholder: "जैसे: राजेश कुमार",
    fieldEmpId: "कर्मचारी आईडी (Employee ID)",
    fieldEmpIdPlaceholder: "जैसे: NHAI-2026-09",
    fieldRole: "पद / श्रेणी",
    fieldRolePlaceholder: "जैसे: सुपरवाइजर, श्रमिक",
    fieldDept: "सेक्टर / विभाग",
    fieldDeptPlaceholder: "जैसे: एनएच-2 जोन 4",
    scanRegistryBoxTitle: "बायोमेट्रिक चेहरा पंजीकरण",
    scanRegistryBoxDesc: "कैमरा उपयोग की अनुमति आवश्यक है। चेहरा पंजीकृत करने के लिए उसे कैमरे के सामने लाएं।",
    btnStartScan: "चेहरा स्कैन शुरू करें",
    btnReScan: "दोबारा चेहरा स्कैन करें",
    formIncompleteTitle: "अपूर्ण जानकारी",
    formIncompleteMsg: "कृपया पहले नाम और कर्मचारी आईडी दर्ज करें।",
    cameraPermissionTitle: "कैमरा आवश्यक",
    cameraPermissionMsg: "बायोमेट्रिक पंजीकरण के लिए कैमरे की अनुमति आवश्यक है।",
    biometricRequiredTitle: "बायोमेट्रिक्स आवश्यक",
    biometricRequiredMsg: "पंजीकरण पूरा करने के लिए कृपया कैमरा स्कैन पूरा करें।",
    regSuccessTitle: "पंजीकरण सफल",
    regSuccessMsg: "कर्मचारी का विवरण सुरक्षित ऑफ़लाइन डेटाबेस में दर्ज कर लिया गया है।",
    
    // Camera Verification
    alignFace: "चेहरा गोल घेरे के अंदर रखें और सीधे स्क्रीन पर देखें",
    capturing: "फोटो लिया जा रहा है...",
    extractingKeypoints: "चेहरे का विश्लेषण किया जा रहा है...",
    captureBtnLabel: "फोटो खींचें",
    aligningReticle: "चेहरे की जांच हो रही है...",
    faceNotDetectedTitle: "चेहरा नहीं मिला",
    faceNotDetectedMsg: "कैमरे में कोई चेहरा नहीं मिला। कृपया सीधे कैमरे में देखें और पुनः प्रयास करें।",
    
    // Liveness Challenges
    livenessSuccessText: "सत्यापन सफल रहा",
    livenessTitle: "चेहरे का सत्यापन",
    challengeSmile: "कृपया मुस्कुराएं",
    challengeBlink: "कृपया अपनी आंखें बंद करें और खोलें",
    challengeTurnLeft: "कृपया अपना सिर बाईं ओर घुमाएं",
    challengeTurnRight: "कृपया अपना सिर दाईं ओर घुमाएं",
    challengeFailedTitle: "सत्यापन विफल",
    challengeFailedMsg: "सत्यापन नहीं हो सका। कृपया निर्देश का पालन करें और पुनः प्रयास करें।",
    comparingFace: "चेहरे का मिलान किया जा रहा है...",
    
    // Result Screens
    verifiedTitle: "उपस्थिति दर्ज हो गई है",
    verifiedSub: "पहचान का ऑफ़लाइन मिलान सफल रहा",
    recordSavedNotice: "रिकॉर्ड सिंक होने के लिए सुरक्षित रख लिया गया है",
    deniedTitle: "पहचान अस्वीकृत",
    deniedSub: "चेहरे का मिलान सफल नहीं रहा",
    deniedDesc: "स्कैन किया गया चेहरा पंजीकृत रिकॉर्ड से मेल नहीं खाता। कृपया रोशनी में सीधे स्क्रीन पर देखें।",
    matchLabel: "मिलान स्कोर",
    inferenceLabel: "गति",
    modelLabel: "एआई मॉडल",
    livenessLabel: "सत्यापन",
    
    // Dashboard & Logs
    dbTitle: "ऑफ़लाइन डेटाबेस कंसोल",
    dbLogsSection: "ऑफ़लाइन सिंक कतार",
    dbActionsSection: "सिस्टम प्रबंधन पैनल",
    dbToggleNet: "नेटवर्क की स्थिति बदलें",
    dbForceSync: "डेटा सर्वर पर भेजें",
    dbResetDB: "डेटाबेस रीसेट करें",
    dbSystemConsole: "सिस्टम ऑडिट डेटा",
    dbLogsPlaceholder: "कोई लॉग नहीं हैं। डेटाबेस सिंक है।",
    dbClearLogs: "सिंक और डिलीट पूरा हुआ",
    dbOnlineActive: "सर्वर एपीआई चालू है",
    dbOfflineActive: "स्थानीय मेमोरी सक्रिय",
    
    // Demo Mismatch Switch
    simulateMismatchLabel: "मिसमैच मोड (असफल मिलान का परीक्षण करें)",
    mismatchActiveBtn: "मिलान विफल होगा",
    mismatchInactiveBtn: "सामान्य मिलान",
  }
};

export function getTranslation(lang: Language, key: keyof typeof TRANSLATIONS.en, variables?: Record<string, string | number>): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dictionary[key] || TRANSLATIONS.en[key] || '';
  if (variables) {
    Object.entries(variables).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
