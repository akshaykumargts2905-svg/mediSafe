"use client";
import { useSyncExternalStore } from "react";
import { getLanguage, subscribeLanguage } from "./language";

const hi = {
  "EXACT": "सटीक मिलान", "POSSIBLE": "संभावित मिलान", "Patients": "रोगी", "Status": "स्थिति",
  "Prescription medicines": "पर्चे की दवाएँ", "Manage medicines": "दवाएँ प्रबंधित करें", "Link a medicine": "दवा जोड़ें", "Edit instructions": "निर्देश संपादित करें", "Remove": "हटाएँ", "Dosage": "खुराक", "Frequency": "आवृत्ति", "Duration": "अवधि", "No medicines linked yet.": "अभी कोई दवा नहीं जोड़ी गई है।",
  "Run full analysis": "पूरी सुरक्षा जाँच करें", "Generate safety report": "सुरक्षा रिपोर्ट बनाएँ", "Analysis completed.": "सुरक्षा जाँच पूरी हुई।", "Report generated.": "रिपोर्ट बन गई।",
  "Confirm or link medicines before running analysis": "सुरक्षा जाँच से पहले दवाएँ जोड़ें या पुष्टि करें।", "Review and confirm the detected medicines before running analysis": "सुरक्षा जाँच से पहले पहचानी गई दवाओं की समीक्षा और पुष्टि करें।", "Choose two different medicines": "दो अलग दवाएँ चुनें।", "Please log in to continue.": "आगे बढ़ने के लिए लॉग इन करें।",
  "A translation is not available for this text. The original text remains available.": "इस पाठ का अनुवाद उपलब्ध नहीं है। मूल पाठ उपलब्ध है।", "Translation is temporarily unavailable. The original text remains available.": "अनुवाद अभी उपलब्ध नहीं है। मूल पाठ उपलब्ध है।",
  "Dashboard": "डैशबोर्ड", "Prescriptions": "पर्चे", "Medicines": "दवाएँ", "Foods": "खाद्य पदार्थ",
  "Interaction checks": "इंटरैक्शन जाँच", "Interaction catalog": "इंटरैक्शन सूची", "Alerts": "अलर्ट", "Safety alerts": "सुरक्षा अलर्ट",
  "Safety reports": "सुरक्षा रिपोर्ट", "Languages": "भाषाएँ", "Knowledge graph": "दवाओं के संबंध", "Doctor tools": "डॉक्टर के उपकरण",
  "Profile": "प्रोफ़ाइल", "Care team": "देखभाल टीम", "My account ↗": "मेरा खाता ↗", "Log out": "लॉग आउट",
  "Patient safety workspace": "रोगी सुरक्षा कार्यक्षेत्र", "Care, with clarity.": "स्पष्ट जानकारी, बेहतर देखभाल।",
  "Review safety information with your healthcare professional.": "सुरक्षा की जानकारी पर अपने डॉक्टर से चर्चा करें।",
  "Medicine catalog": "दवा सूची", "Food catalog": "खाद्य सूची", "Drug interaction catalog": "दवा इंटरैक्शन सूची", "Food interaction catalog": "खाद्य इंटरैक्शन सूची",
  "Drug–drug check": "दवा–दवा इंटरैक्शन जाँच", "Drug–food check": "दवा–खाद्य इंटरैक्शन जाँच",
  "Choose items from the live backend catalog to check known interactions.": "दर्ज इंटरैक्शन जाँचने के लिए सूची से दवाएँ और खाद्य पदार्थ चुनें।",
  "Medicine": "दवा", "Second medicine": "दूसरी दवा", "Food": "खाद्य पदार्थ", "First medicine": "पहली दवा",
  "Select a medicine": "दवा चुनें", "Select a food": "खाद्य पदार्थ चुनें", "Check interaction": "इंटरैक्शन जाँचें", "Checking…": "जाँच हो रही है…",
  "Refresh catalog": "सूची फिर लोड करें", "Retry loading catalog": "सूची फिर लोड करें", "Loading medicine catalog…": "दवा सूची लोड हो रही है…",
  "No matching interaction found": "कोई दर्ज इंटरैक्शन नहीं मिला", "No medicines have been added to the catalog yet.": "सूची में अभी कोई दवा नहीं है।",
  "No foods have been added to the catalog yet.": "सूची में अभी कोई खाद्य पदार्थ नहीं है।", "Ask a catalog editor to add records, then refresh.": "सूची संपादक से रिकॉर्ड जोड़ने को कहें, फिर सूची लोड करें।",
  "What this means": "इसका अर्थ", "Possible risk": "संभावित खतरा", "Recommended action": "क्या करें", "Source": "जानकारी का स्रोत",
  "For clinician review": "डॉक्टर की समीक्षा के लिए", "No recommendation provided.": "कोई सुझाव दर्ज नहीं है।", "Original English text shown where Hindi is unavailable.": "जहाँ हिंदी उपलब्ध नहीं है, वहाँ मूल अंग्रेज़ी पाठ दिखाया गया है।",
  "Review this result with your doctor or pharmacist. Do not start, stop or replace a medicine based on this check alone.": "इस परिणाम पर डॉक्टर या फार्मासिस्ट से बात करें। केवल इस जाँच के आधार पर दवा शुरू, बंद या बदलें नहीं।",
  "This check only searches stored interaction records. No match does not establish that the selected combination is safe.": "यह जाँच केवल दर्ज इंटरैक्शन खोजती है। परिणाम न मिलना सुरक्षित होने की गारंटी नहीं है।",
  "LOW": "कम", "MODERATE": "मध्यम", "HIGH": "उच्च", "CRITICAL": "गंभीर", "HIGH RISK": "उच्च जोखिम", "REVIEW REQUIRED": "समीक्षा आवश्यक", "NO KNOWN ALERTS": "कोई दर्ज अलर्ट नहीं",
  "Listen": "सुनें", "Stop audio": "ऑडियो रोकें", "Speaking…": "पढ़ा जा रहा है…", "Voice is unavailable for this language. Read the text above.": "इस भाषा की आवाज़ उपलब्ध नहीं है। ऊपर दिया पाठ पढ़ें।",
  "Audio could not be played. Read the text above.": "ऑडियो नहीं चल सका। ऊपर दिया पाठ पढ़ें।",
  "Refresh": "फिर लोड करें", "Retry": "फिर कोशिश करें", "Loading MediSafe data…": "जानकारी लोड हो रही है…", "No record yet.": "अभी कोई रिकॉर्ड नहीं है।",
  "Save": "सहेजें", "Saving…": "सहेजा जा रहा है…", "Saved successfully.": "सफलतापूर्वक सहेजा गया।", "Cancel": "रद्द करें", "Edit": "संपादित करें", "Delete": "हटाएँ", "Details": "विवरण", "Close details": "विवरण बंद करें",
  "Add a prescription": "पर्चा जोड़ें", "Upload prescription image": "पर्चे की तस्वीर अपलोड करें", "Prescription image": "पर्चे की तस्वीर", "OCR language": "तस्वीर की भाषा", "Extract medicines": "दवाएँ पहचानें", "Reading prescription…": "पर्चा पढ़ा जा रहा है…",
  "PNG, JPEG or WebP, up to 5 MB. Review every detected medicine before analysis.": "PNG, JPEG या WebP, अधिकतम 5 MB। जाँच से पहले हर पहचानी गई दवा की समीक्षा करें।",
  "Enter prescription manually": "पर्चा स्वयं दर्ज करें", "Prescription file name": "पर्चे का नाम", "Prescription text (optional)": "पर्चे का पाठ (वैकल्पिक)", "Save prescription": "पर्चा सहेजें", "Existing file URL (optional)": "फ़ाइल का लिंक (वैकल्पिक)",
  "Prescription text": "पर्चे का पाठ", "Review detected medicines": "पहचानी गई दवाओं की समीक्षा", "Extracted text": "पहचाना गया पाठ", "Save corrected text": "सुधारा हुआ पाठ सहेजें", "OCR confidence": "OCR विश्वास स्तर",
  "Low confidence. Check the original image and correct the text before confirming.": "विश्वास स्तर कम है। पुष्टि से पहले मूल तस्वीर देखकर पाठ सुधारें।",
  "Select the medicines actually present on your prescription. Nothing is added automatically.": "केवल अपने पर्चे पर मौजूद दवाएँ चुनें। कोई दवा अपने आप नहीं जोड़ी जाती।",
  "Other catalog medicines": "सूची की अन्य दवाएँ", "Unmatched text": "बिना मिलान वाला पाठ", "No catalog matches found. Correct the text or select medicines below.": "सूची में मिलान नहीं मिला। पाठ सुधारें या नीचे दवाएँ चुनें।",
  "Confirm medicines": "दवाओं की पुष्टि करें", "Confirming…": "पुष्टि हो रही है…", "Medicines confirmed. You can now run analysis.": "दवाओं की पुष्टि हो गई। अब इंटरैक्शन जाँच सकते हैं।", "Run analysis": "सुरक्षा जाँचें", "Safety analysis": "सुरक्षा विश्लेषण", "Analyzing…": "विश्लेषण हो रहा है…", "View safety report": "सुरक्षा रिपोर्ट देखें",
  "Food check scope": "खाद्य जाँच का दायरा", "All known food cautions": "सभी दर्ज खाद्य सावधानियाँ", "Skip food checks": "खाद्य जाँच छोड़ें", "Selected foods only": "केवल चुने गए खाद्य पदार्थ", "Select foods": "खाद्य पदार्थ चुनें",
  "No known alerts does not establish clinical safety. Review medication decisions with your care team.": "अलर्ट न होने का अर्थ सुरक्षित होना नहीं है। दवाओं के निर्णय पर अपनी देखभाल टीम से बात करें।",
  "Safety report": "सुरक्षा रिपोर्ट", "Total medicines": "कुल दवाएँ", "Total alerts": "कुल अलर्ट", "High risk alerts": "उच्च जोखिम अलर्ट", "Overall status": "कुल स्थिति", "Generate report": "रिपोर्ट बनाएँ", "SUMMARY": "सारांश",
  "Available languages": "उपलब्ध भाषाएँ", "Language": "भाषा", "English": "English", "Hindi": "हिंदी", "Language saved.": "भाषा सहेजी गई।", "Translation": "अनुवाद", "Text": "पाठ", "Translate": "अनुवाद करें", "Source language": "मूल भाषा", "Target language": "अनुवाद की भाषा",
  "Patient": "रोगी", "Doctor dashboard": "डॉक्टर डैशबोर्ड", "Recommendations": "सुझाव", "Doctor recommendations": "डॉक्टर के सुझाव", "Prescription review": "पर्चे की समीक्षा", "Prescription safety alerts": "पर्चे के सुरक्षा अलर्ट",
  "A verified doctor account is required": "सत्यापित डॉक्टर का खाता आवश्यक है", "Share with a doctor": "डॉक्टर के साथ साझा करें", "Doctor email": "डॉक्टर का ईमेल", "Grant access": "अनुमति दें", "Revoke access": "अनुमति वापस लें", "No doctors have access to your records.": "किसी डॉक्टर को आपके रिकॉर्ड की अनुमति नहीं है।",
  "Your dashboard": "आपका डैशबोर्ड", "Your medication safety overview.": "आपकी दवाओं की सुरक्षा का सारांश।", "Unread alerts": "बिना पढ़े अलर्ट", "Reports": "रिपोर्ट", "Recent prescriptions": "हाल के पर्चे", "Recent alerts": "हाल के अलर्ट", "Continue with a safety check": "सुरक्षा जाँच करें", "Add prescription": "पर्चा जोड़ें", "Check medicines": "दवाएँ जाँचें", "Check food interactions": "खाद्य इंटरैक्शन जाँचें",
  "Mark read": "पढ़ा हुआ चिह्नित करें", "Read": "पढ़ा हुआ", "Unread": "बिना पढ़ा", "No alerts for this view.": "यहाँ कोई अलर्ट नहीं है।", "No alerts recorded.": "कोई अलर्ट दर्ज नहीं है।",
};

export function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => "en");
  return { language, t: (text) => language === "hi" ? hi[text] || text : text };
}

// Medicine names and identifiers are never passed through the UI dictionary.
export function patientText(record, field, language) {
  if (!record) return "";
  if (record.display?.language === language && record.display[field]) return record.display[field];
  return language === "hi" && record[field + "Hi"] ? record[field + "Hi"] : record[field] || "";
}
