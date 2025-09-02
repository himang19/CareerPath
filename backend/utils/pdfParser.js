// // utils/pdfParser.js
// import fs from "fs";
// import path from "path";
// import axios from "axios";
// import pdfParse from "pdf-parse";
// import { fileURLToPath } from "url";
// import crypto from "crypto";

// const TMP_DIR = path.join(process.cwd(), "tmp");
// if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// async function fetchWithRetries(url, tries = 2, backoff = 400) {
//   let lastErr = null;
//   for (let i = 0; i <= tries; i++) {
//     try {
//       return await axios.get(url, { responseType: "arraybuffer", timeout: 30000, maxRedirects: 5 });
//     } catch (e) {
//       lastErr = e;
//       if (i < tries) await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
//     }
//   }
//   throw lastErr;
// }

// export async function extractTextFromPdf(source) {
//   if (!source) throw new Error("No source provided to extractTextFromPdf");

//   try {
//     let buffer = null;

//     // 1) Remote URL
//     if (/^https?:\/\//i.test(source)) {
//       const resp = await fetchWithRetries(source, 2, 400);
//       if (!resp || !resp.status || resp.status >= 400) {
//         throw new Error(`HTTP ${resp ? resp.status : "ERR"} when fetching PDF`);
//       }
//       buffer = Buffer.from(resp.data); // IMPORTANT: convert ArrayBuffer -> Buffer

//       // Quick sanity: small buffer or not starting with %PDF
//       if (!buffer || buffer.length < 200 || !/%PDF-/.test(buffer.slice(0, 32).toString("utf8"))) {
//         const debugPath = path.join(TMP_DIR, `debug_notpdf_${Date.now()}.bin`);
//         fs.writeFileSync(debugPath, buffer || Buffer.alloc(0));
//         throw new Error(`Fetched resource doesn't look like a PDF (len=${buffer ? buffer.length : 0}). Saved to ${debugPath}`);
//       }

//     } else {
//       // 2) Local paths handling: check before reading (prevents ENOENT)
//       const candidates = [];
//       if (path.isAbsolute(source)) candidates.push(source);
//       candidates.push(path.resolve(process.cwd(), source));
//       try {
//         const modulePath = fileURLToPath(import.meta.url);
//         candidates.push(path.resolve(path.dirname(modulePath), source));
//       } catch (e) { /* ignore */ }

//       let found = null;
//       for (const cand of candidates) {
//         if (fs.existsSync(cand)) { found = cand; break; }
//       }
//       if (!found) {
//         throw new Error(`Local file not found. Tried: ${candidates.join(" | ")}`);
//       }
//       buffer = fs.readFileSync(found);
//     }

//     // 3) Parse PDF safely
//     let parsed;
//     try {
//       parsed = await pdfParse(buffer);
//     } catch (parseErr) {
//       const debugPath = path.join(TMP_DIR, `debug_pdfparse_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.bin`);
//       fs.writeFileSync(debugPath, buffer);
//       parseErr.message = `pdf-parse failed; raw saved to ${debugPath}; ${parseErr.message}`;
//       throw parseErr;
//     }

//     const text = parsed?.text?.trim?.() || "";
//     if (!text) {
//       const debugPath = path.join(TMP_DIR, `debug_emptytext_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.bin`);
//       fs.writeFileSync(debugPath, buffer);
//       throw new Error(`pdf-parse returned empty text (possibly image-only PDF). Saved raw PDF to ${debugPath}. Consider OCR.`);
//     }
// console.log(text);
//     return text;
//   } catch (err) {
//     err.message = `extractTextFromPdf failed for source="${source}": ${err.message}`;
//     throw err;
//   }
// }














/////////////////WOKRING FINEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE??????????

//worked fine
// import fs from "fs";
// import path from "path";
// import axios from "axios";
// /**
//  * Extract text from PDF
//  * Supports:
//  * - Local file path  
//  * - Remote URL (Cloudinary, etc.)
//  * - Base64 string
//  */
// export async function extractTextFromPdf(pdfSource) {
//   console.log("=== PDF Parser Debug ===");
//   console.log("PDF Source received:", pdfSource);
//   console.log("Type:", typeof pdfSource);
//   console.log("Is URL test:", /^https?:\/\//i.test(pdfSource));
  
//   try {
//     let dataBuffer;
    
//     // 1) Base64 string
//     if (typeof pdfSource === "string" && pdfSource.startsWith("data:application/pdf;base64,")) {
//       console.log("MATCHED: Processing as Base64");
//       const base64Data = pdfSource.split(",")[1];
//       dataBuffer = Buffer.from(base64Data, "base64");
//     }
//     // 2) Remote URL (starts with http/https)
//     else if (typeof pdfSource === "string" && /^https?:\/\//i.test(pdfSource.trim())) {
//       console.log("MATCHED: Processing as URL:", pdfSource.trim());
      
//       // Fix Cloudinary URL for PDFs
//       let correctedUrl = pdfSource.trim();
//       if (correctedUrl.includes('cloudinary.com') && correctedUrl.includes('/image/upload/')) {
//         // correctedUrl = correctedUrl.replace('/image/upload/', '/raw/upload/');
//         console.log("Corrected Cloudinary URL:", correctedUrl);
//       }
      
//       console.log("Making axios request to:", correctedUrl);
      
//       let response;
//       try {
//         // Try corrected URL first
//         response = await axios.get(correctedUrl, { 
//           responseType: "arraybuffer",
//           timeout: 30000
//         });
//         console.log("Corrected URL worked, status:", response.status);
//       } catch (correctedUrlError) {
//          console.log("Corrected URL failed:", correctedUrlError.message);
//   console.log("Error code:", correctedUrlError.code);
//   console.log("Response status:", correctedUrlError.response?.status);
//         console.log(" Corrected URL failed, trying original URL...");
//         // Fallback to original URL
//         response = await axios.get(pdfSource.trim(), { 
//           responseType: "arraybuffer",
//           timeout: 30000
//         });
//         console.log("Original URL worked, status:", response.status);
//       }
      
//       dataBuffer = Buffer.from(response.data);
//       console.log("Buffer created successfully, size:", dataBuffer.length);
//     }
//     // 3) Local file path
//     else if (typeof pdfSource === "string") {
//       console.log("FALLBACK: Processing as Local File Path");
//       const absolutePath = path.isAbsolute(pdfSource)
//         ? pdfSource
//         : path.join(process.cwd(), pdfSource);

//       if (!fs.existsSync(absolutePath)) {
//         console.warn(`PDF file does not exist at path: ${absolutePath}`);
//         return "";
//       }
//       dataBuffer = fs.readFileSync(absolutePath);
//     }
//     // 4) Already a Buffer
//     else if (pdfSource instanceof Buffer) {
//       console.log(" MATCHED: Processing as Buffer");
//       dataBuffer = pdfSource;
//     } else {
//       throw new Error("Invalid PDF source: must be path, URL, base64, or Buffer");
//     }

//     console.log("About to parse PDF...");
    
//     // Try pdf2json
//     try {
//       console.log("Using pdf2json for parsing...");
//       const PDFParser = (await import("pdf2json")).default;
      
//       return new Promise((resolve, reject) => {
//         const pdfParser = new PDFParser();
        
//         pdfParser.on("pdfParser_dataReady", (pdfData) => {
//           try {
//             let text = pdfParser.getRawTextContent();
//             console.log("PDF parsed successfully, text length:", text.length);
            
//             // If no text found, try alternative extraction
//             if (!text || text.trim().length === 0) {
//               console.log("No text found with getRawTextContent, trying alternative...");
              
//               // Try extracting from pdfData directly
//               if (pdfData && pdfData.Pages) {
//                 const extractedTexts = [];
//                 pdfData.Pages.forEach(page => {
//                   if (page.Texts) {
//                     page.Texts.forEach(textItem => {
//                       if (textItem.R) {
//                         textItem.R.forEach(run => {
//                           if (run.T) {
//                             extractedTexts.push(decodeURIComponent(run.T));
//                           }
//                         });
//                       }
//                     });
//                   }
//                 });
//                 text = extractedTexts.join(' ');
//                 console.log("Alternative extraction found text length:", text.length);
//               }
//             }
            
//             if (text && text.trim().length > 0) {
//               console.log("EXTRACTED FULL TEXT:", text);
//               resolve(text.replace(/\r/g, "\n").replace(/\t/g, " ").trim());
//             } else {
//               console.log("PDF appears to be image-based or empty");
//               resolve("PDF processed successfully. This appears to be an image-based PDF. Consider using OCR for text extraction or manual review.");
//             }
//           } catch (err) {
//             console.log("Text extraction failed:", err.message);
//             resolve("PDF downloaded but text extraction failed. Manual review recommended.");
//           }
//         });
        
//         pdfParser.on("pdfParser_dataError", (errData) => {
//           console.log("PDF parsing error:", errData.parserError);
//           resolve("PDF parsing failed. Manual review recommended.");
//         });
        
//         pdfParser.parseBuffer(dataBuffer);
//       });
//     } catch (pdfParseError) {
//       console.log("pdf2json failed:", pdfParseError.message);
//       return "PDF content extracted successfully but text parsing unavailable. Please check the resume manually.";
//     }
    
//   } catch (err) {
//     console.error("Error extracting PDF text:", err.message || err);
//     return "";
//   }
// }
































// import fs from "fs";
// import path from "path";
// import axios from "axios";

// /**
//  * Extract text from PDF
//  * Supports:
//  * - Local file path  
//  * - Remote URL (Cloudinary, etc.)
//  * - Base64 string
//  */
// export async function extractTextFromPdf(pdfSource) {
//   console.log("=== PDF Parser Debug ===");
//   console.log("PDF Source received:", pdfSource);
//   console.log("Type:", typeof pdfSource);
//   console.log("Is URL test:", /^https?:\/\//i.test(pdfSource));
  
//   try {
//     let dataBuffer;
    
//     // 1) Base64 string
//     if (typeof pdfSource === "string" && pdfSource.startsWith("data:application/pdf;base64,")) {
//       console.log("✅ MATCHED: Processing as Base64");
//       const base64Data = pdfSource.split(",")[1];
//       dataBuffer = Buffer.from(base64Data, "base64");
//     }
//     // 2) Remote URL (starts with http/https)
//     else if (typeof pdfSource === "string" && /^https?:\/\//i.test(pdfSource.trim())) {
//       console.log("✅ MATCHED: Processing as URL:", pdfSource.trim());
      
//       // Fix Cloudinary URL for PDFs
//       let correctedUrl = pdfSource.trim();
//       if (correctedUrl.includes('cloudinary.com') && correctedUrl.includes('/image/upload/')) {
//         // correctedUrl = correctedUrl.replace('/image/upload/', '/raw/upload/');
//         console.log("Corrected Cloudinary URL:", correctedUrl);
//       }
      
//       console.log("Making axios request to:", correctedUrl);
      
//       let response;
//       try {
//         // Try corrected URL first
//         response = await axios.get(correctedUrl, { 
//           responseType: "arraybuffer",
//           timeout: 30000
//         });
//         console.log("✅ Corrected URL worked, status:", response.status);
//       } catch (correctedUrlError) {
//         console.log("❌ Corrected URL failed, trying original URL...");
//         // Fallback to original URL
//         response = await axios.get(pdfSource.trim(), { 
//           responseType: "arraybuffer",
//           timeout: 30000
//         });
//         console.log("✅ Original URL worked, status:", response.status);
//       }
      
//       dataBuffer = Buffer.from(response.data);
//       console.log("Buffer created successfully, size:", dataBuffer.length);
//     }
//     // 3) Local file path
//     else if (typeof pdfSource === "string") {
//       console.log("❌ FALLBACK: Processing as Local File Path");
//       const absolutePath = path.isAbsolute(pdfSource)
//         ? pdfSource
//         : path.join(process.cwd(), pdfSource);

//       if (!fs.existsSync(absolutePath)) {
//         console.warn(`PDF file does not exist at path: ${absolutePath}`);
//         return "";
//       }
//       dataBuffer = fs.readFileSync(absolutePath);
//     }
//     // 4) Already a Buffer
//     else if (pdfSource instanceof Buffer) {
//       console.log("✅ MATCHED: Processing as Buffer");
//       dataBuffer = pdfSource;
//     } else {
//       throw new Error("Invalid PDF source: must be path, URL, base64, or Buffer");
//     }

//     console.log("About to parse PDF...");
    
//     // Try pdf-parse with proper error handling
//     try {
//       const { default: pdfParse } = await import("pdf-parse");
//       const data = await pdfParse(dataBuffer);
//       console.log("PDF parsed successfully with pdf-parse, text length:", data.text?.length || 0);
//       console.log("ghddddddddddddddd",data.text?.replace(/\r/g, "\n").replace(/\t/g, " ").trim() || "");
//       return data.text?.replace(/\r/g, "\n").replace(/\t/g, " ").trim() || "";
//     } catch (pdfParseError) {
//       console.log("pdf-parse failed, trying alternative method...");
      
//       // Fallback: Return a basic text extraction message
//       console.log("Using fallback text extraction");
//       return "PDF content extracted successfully but text parsing unavailable. Please check the resume manually.";
//     }
    
//   } catch (err) {
//     console.error("Error extracting PDF text:", err.message || err);
//     return "";
//   }
// }












// utils/pdfParser.js
// import fs from "fs";
// import path from "path";
// import axios from "axios"; // optional, not used but safe
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js"; // npm i pdfjs-dist
// import crypto from "crypto";

// // OPTIONAL OCR: if you want, install a node wrapper + system tesseract
// // import tesseract from "node-tesseract-ocr"; // npm i node-tesseract-ocr
// // NOTE: system tesseract must be installed (apt/yum/choco).

// const TMP_DIR = path.join(process.cwd(), "tmp");
// if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// function saveDebugBuffer(buffer, prefix = "pdf_debug") {
//   try {
//     const debugPath = path.join(TMP_DIR, `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.bin`);
//     fs.writeFileSync(debugPath, buffer);
//     return debugPath;
//   } catch (e) {
//     return null;
//   }
// }

// function normalizeTextForOutput(s = "") {
//   return String(s || "")
//     .replace(/\r/g, "\n")
//     .replace(/\t/g, " ")
//     .replace(/\u00A0/g, " ")
//     .replace(/[ ]{2,}/g, " ")
//     .replace(/\n{3,}/g, "\n\n")
//     .trim();
// }

// // Heuristic to insert spaces for glued words like "HimanshuAgrawal"
// function insertMissingSpaces(s = "") {
//   // insert space between lower->Upper
//   let t = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
//   // separate letters/digits glued to punctuation
//   t = t.replace(/([a-zA-Z])([0-9])/g, "$1 $2");
//   t = t.replace(/([0-9])([a-zA-Z])/g, "$1 $2");
//   // fix common ligatures / weird chars
//   t = t.replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl");
//   return t;
// }

// // Layout-aware extraction using pdfjs-dist
// async function extractWithPdfJsLayout(buffer) {
//   const loadingTask = pdfjsLib.getDocument({
//     data: buffer,
//     disableAutoFetch: true,
//     disableRange: true,
//     // Optionally set verbosity
//     // verbosity: 0
//   });

//   const pdf = await loadingTask.promise;
//   const pages = [];

//   for (let p = 1; p <= pdf.numPages; p++) {
//     const page = await pdf.getPage(p);
//     const content = await page.getTextContent();

//     // Collect items with x,y and text
//     const items = content.items.map(item => {
//       const transform = item.transform || [1,0,0,1,0,0];
//       const x = transform[4] || 0;
//       const y = transform[5] || 0;
//       return { str: String(item.str || ""), x, y };
//     });

//     // Group items into lines by y coordinate with tolerance
//     const linesMap = [];
//     const tolerance = 3; // pixels; adjust if needed
//     for (const it of items) {
//       let placed = false;
//       for (const grp of linesMap) {
//         if (Math.abs(grp.y - it.y) <= tolerance) {
//           grp.items.push(it);
//           placed = true;
//           break;
//         }
//       }
//       if (!placed) {
//         linesMap.push({ y: it.y, items: [it] });
//       }
//     }

//     // Sort lines by descending y (pdf coordinate origin bottom-left)
//     linesMap.sort((a, b) => b.y - a.y);

//     // Convert each line to text: sort by x and decide spaces by gap heuristics
//     const pageLines = [];
//     for (const lg of linesMap) {
//       const lineItems = lg.items.sort((a, b) => a.x - b.x);
//       // compute gaps
//       const gaps = [];
//       for (let i = 0; i < lineItems.length - 1; i++) {
//         gaps.push(lineItems[i+1].x - (lineItems[i].x + (lineItems[i].str.length || 0) * 1.0));
//       }
//       const medianGap = gaps.length ? gaps.sort((a,b)=>a-b)[Math.floor(gaps.length/2)] : 0;
//       let reconstructed = "";
//       for (let i = 0; i < lineItems.length; i++) {
//         const txt = lineItems[i].str || "";
//         reconstructed += txt;
//         if (i < lineItems.length - 1) {
//           const gap = lineItems[i+1].x - lineItems[i].x;
//           // Heuristic: if gap is relatively large -> add a space
//           // Compare with medianGap and an absolute px threshold
//           if (gap > Math.max(6, Math.abs(medianGap) * 1.3)) reconstructed += " ";
//           else {
//             // also add space if last char and next first char both alpha and camelcase boundary etc.
//             const nextTxt = lineItems[i+1].str || "";
//             if (/[a-z0-9]$/.test(txt) && /^[A-Z]/.test(nextTxt)) reconstructed += " ";
//           }
//         }
//       }
//       pageLines.push(reconstructed.trim());
//     }

//     pages.push(pageLines.join("\n"));
//   }

//   const combined = pages.join("\n\n");
//   const cleaned = normalizeTextForOutput(insertMissingSpaces(combined));
//   return cleaned;
// }

// // Your existing pdf2json-based extraction (improved a bit)
// async function extractWithPdf2Json(buffer) {
//   try {
//     const PDFParser = (await import("pdf2json")).default;
//     return await new Promise((resolve) => {
//       const pdfParser = new PDFParser();
//       pdfParser.on("pdfParser_dataReady", (pdfData) => {
//         try {
//           let text = pdfParser.getRawTextContent && pdfParser.getRawTextContent() ? pdfParser.getRawTextContent() : "";
//           // fallback extraction
//           if (!text || text.trim().length === 0) {
//             const parts = [];
//             if (pdfData && pdfData.Pages) {
//               pdfData.Pages.forEach(page => {
//                 if (page.Texts) {
//                   page.Texts.forEach(textItem => {
//                     if (textItem.R) {
//                       textItem.R.forEach(run => {
//                         if (run.T) parts.push(decodeURIComponent(run.T));
//                       });
//                     }
//                   });
//                 }
//               });
//             }
//             text = parts.join(" ");
//           }
//           resolve(normalizeTextForOutput(insertMissingSpaces(text)));
//         } catch (e) {
//           resolve(""); // degrade gracefully
//         }
//       });
//       pdfParser.on("pdfParser_dataError", () => resolve(""));
//       pdfParser.parseBuffer(buffer);
//     });
//   } catch (e) {
//     return "";
//   }
// }

// // OPTIONAL OCR using tesseract (commented out by default)
// async function extractWithOCR(buffer) {
//   // Uncomment if you installed node-tesseract-ocr and system tesseract
//   /*
//   const tmpPath = path.join(TMP_DIR, `ocr_${Date.now()}.pdf`);
//   fs.writeFileSync(tmpPath, buffer);
//   const config = { lang: "eng", oem: 1, psm: 3 };
//   try {
//     const text = await tesseract.recognize(tmpPath, config);
//     return normalizeTextForOutput(insertMissingSpaces(text));
//   } finally {
//     try { fs.unlinkSync(tmpPath); } catch (e) {}
//   }
//   */
//   return "";
// }

// // Simple quality metric
// function textQualityScore(text = "") {
//   if (!text) return 0;
//   const words = text.split(/\s+/).filter(Boolean).length;
//   const avgWordLen = text.replace(/\s+/g, " ").split(" ").reduce((acc, w) => acc + w.length, 0) / Math.max(1, words);
//   // score based on number of words (dominant) and average word length sanity check
//   return words + Math.max(0, Math.floor((avgWordLen - 3) * 0.2 * words));
// }

// // MAIN exported function - pipeline
// export async function extractTextFromPdf(pdfSource) {
//   console.log("=== extractTextFromPdf START ===");
//   try {
//     if (!pdfSource) return "";

//     // prepare buffer
//     let buffer = null;
//     // base64 data url
//     if (typeof pdfSource === "string" && pdfSource.startsWith("data:application/pdf;base64,")) {
//       const base64 = pdfSource.split(",", 2)[1];
//       buffer = Buffer.from(base64, "base64");
//     } else if (typeof pdfSource === "string" && /^https?:\/\//i.test(pdfSource.trim())) {
//       // URL
//       const url = pdfSource.trim();
//       const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 30000, maxRedirects: 5 });
//       buffer = Buffer.from(resp.data);
//     } else if (Buffer.isBuffer(pdfSource)) {
//       buffer = pdfSource;
//     } else if (typeof pdfSource === "string") {
//       // local path
//       const absolute = path.isAbsolute(pdfSource) ? pdfSource : path.resolve(process.cwd(), pdfSource);
//       if (!fs.existsSync(absolute)) {
//         console.warn("Local PDF missing:", absolute);
//         return "";
//       }
//       buffer = fs.readFileSync(absolute);
//     } else {
//       throw new Error("Unsupported pdfSource type");
//     }

//     // 1) Try layout-aware pdfjs extraction (best for spacing/headings)
//     try {
//       const txt1 = await extractWithPdfJsLayout(buffer);
//       const score1 = textQualityScore(txt1);
//       console.log("pdfjs layout extraction words:", txt1.split(/\s+/).filter(Boolean).length, "score:", score1);
//       if (score1 >= 40) { // threshold: adjust based on your data
//         console.log("Using pdfjs layout extraction result.");
//         return txt1;
//       }
//       // otherwise keep result as candidate & fall back
//       console.log("pdfjs result low quality; falling back...");
//     } catch (e) {
//       console.warn("pdfjs layout extraction failed:", e.message || e);
//     }

//     // 2) Try pdf2json (your existing approach)
//     try {
//       const txt2 = await extractWithPdf2Json(buffer);
//       const score2 = textQualityScore(txt2);
//       console.log("pdf2json extraction words:", txt2.split(/\s+/).filter(Boolean).length, "score:", score2);
//       if (score2 >= 25) {
//         console.log("Using pdf2json extraction result.");
//         console.log("pdf2json result:", txt2);
//         return txt2;
//       }
//       console.log("pdf2json result low quality; will try OCR fallback if enabled.");
//     } catch (e) {
//       console.warn("pdf2json extraction failed:", e.message || e);
//     }

//     // 3) Optional OCR fallback (uncomment and install if needed)
//     /*
//     const ocrText = await extractWithOCR(buffer);
//     if (ocrText && ocrText.trim().length > 20) return ocrText;
//     */

//     // 4) If everything low-quality, return best candidate we have or save debug and return empty
//     // Prefer longer of txt1/txt2 if available
//     let best = "";
//     try { const a = await extractWithPdfJsLayout(buffer); if (a && a.length > best.length) best = a; } catch(_) {}
//     try { const b = await extractWithPdf2Json(buffer); if (b && b.length > best.length) best = b; } catch(_) {}
//     if (best && best.split(/\s+/).filter(Boolean).length >= 5) return best;

//     // save debug
//     const dbg = saveDebugBuffer(buffer, "pdf_fallback");
//     console.warn("All parsers low-quality. Saved debug to:", dbg);
//     return "";
//   } catch (err) {
//     console.error("extractTextFromPdf ERROR:", err.message || err);
//     return "";
//   } finally {
//     console.log("=== extractTextFromPdf END ===");
//   }
// }




























// utils/pdfParser.js
import fs from "fs";
import path from "path";
import axios from "axios";
// import pdfParse from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import crypto from "crypto";

const TMP_DIR = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function saveDebugBuffer(buf, prefix = "pdf_debug") {
  try {
    const p = path.join(TMP_DIR, `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.bin`);
    fs.writeFileSync(p, buf);
    return p;
  } catch (e) { return null; }
}
function normalizeText(s = "") {
  return String(s || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function insertMissingSpaces(s = "") {
  let t = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  t = t.replace(/([a-zA-Z])([0-9])/g, "$1 $2");
  t = t.replace(/([0-9])([a-zA-Z])/g, "$1 $2");
  t = t.replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl");
  return t;
}
function textQualityScore(text = "") {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  const avg = text.replace(/\s+/g," ").split(" ").reduce((a,b)=>a+b.length,0)/Math.max(1,words);
  return words + Math.max(0, Math.floor((avg-3)*0.2*words));
}

/* Layout-aware extraction using pdfjs */
async function extractWithPdfJsLayout(buffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: buffer,
    disableAutoFetch: true,
    disableRange: true
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.map(it => {
      const t = it.transform || [1,0,0,1,0,0];
      return { str: String(it.str || ""), x: t[4] || 0, y: t[5] || 0 };
    });
    // group by y (line)
    const lines = [];
    const tol = 3;
    for (const it of items) {
      let placed = false;
      for (const grp of lines) {
        if (Math.abs(grp.y - it.y) <= tol) { grp.items.push(it); placed = true; break; }
      }
      if (!placed) lines.push({ y: it.y, items: [it] });
    }
    lines.sort((a,b)=>b.y-a.y);
    const pageLines = [];
    for (const lg of lines) {
      const row = lg.items.sort((a,b)=>a.x-b.x);
      // compute median gap heuristic
      const gaps = [];
      for (let i=0;i<row.length-1;i++) gaps.push(row[i+1].x - row[i].x);
      const medianGap = gaps.length ? gaps.sort((a,b)=>a-b)[Math.floor(gaps.length/2)] : 0;
      let reconstructed = "";
      for (let i=0;i<row.length;i++) {
        const t = row[i].str || "";
        reconstructed += t;
        if (i < row.length - 1) {
          const gap = row[i+1].x - row[i].x;
          if (gap > Math.max(6, Math.abs(medianGap)*1.3)) reconstructed += " ";
          else {
            const nextTxt = row[i+1].str || "";
            if (/[a-z0-9]$/.test(t) && /^[A-Z]/.test(nextTxt)) reconstructed += " ";
          }
        }
      }
      pageLines.push(reconstructed.trim());
    }
    pages.push(pageLines.join("\n"));
  }
  const combined = pages.join("\n\n");
  return normalizeText(insertMissingSpaces(combined));
}

/* Try pdf-parse (simple) */
// async function extractWithPdfParse(buffer) {
//   try {
//     const data = await pdfParse(buffer);
//     const t = data && data.text ? String(data.text) : "";
//     return normalizeText(insertMissingSpaces(t));
//   } catch (e) {
//     return "";
//   }
// }

/* pdf2json fallback (keeps your pdf2json logic) */
async function extractWithPdf2Json(buffer) {
  try {
    const PDFParser = (await import("pdf2json")).default;
    return await new Promise((resolve) => {
      const pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        try {
          let text = "";
          if (pdfParser.getRawTextContent) text = pdfParser.getRawTextContent() || "";
          if (!text || !text.trim()) {
            const parts = [];
            if (pdfData && pdfData.Pages) {
              pdfData.Pages.forEach(page => {
                if (page.Texts) {
                  page.Texts.forEach(item => {
                    if (item.R) {
                      item.R.forEach(run => { if (run.T) parts.push(decodeURIComponent(run.T)); });
                    }
                  });
                }
              });
            }
            text = parts.join(" ");
          }
          resolve(normalizeText(insertMissingSpaces(text)));
        } catch (err) { resolve(""); }
      });
      pdfParser.on("pdfParser_dataError", () => resolve(""));
      pdfParser.parseBuffer(buffer);
    });
  } catch (e) {
    return "";
  }
}

/* Main pipeline */
export async function extractTextFromPdf(pdfSource) {
  try {
    if (!pdfSource) return "";
    let buffer = null;

    // base64 data url
    if (typeof pdfSource === "string" && pdfSource.startsWith("data:application/pdf;base64,")) {
      const base64 = pdfSource.split(",",2)[1];
      buffer = Buffer.from(base64, "base64");
    } else if (typeof pdfSource === "string" && /^https?:\/\//i.test(pdfSource.trim())) {
      const url = pdfSource.trim();
      const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 30000, maxRedirects: 5 });
      buffer = Buffer.from(resp.data);
    } else if (Buffer.isBuffer(pdfSource)) {
      buffer = pdfSource;
    } else if (typeof pdfSource === "string") {
      const absolute = path.isAbsolute(pdfSource) ? pdfSource : path.resolve(process.cwd(), pdfSource);
      if (!fs.existsSync(absolute)) {
        console.warn("Local PDF missing:", absolute);
        return "";
      }
      buffer = fs.readFileSync(absolute);
    } else {
      throw new Error("Unsupported pdfSource type");
    }

    // 1) pdfjs layout extraction (best for headings/spacing)
    try {
      const out1 = await extractWithPdfJsLayout(buffer);
      const score1 = textQualityScore(out1);
      if (score1 >= 40) return out1;
      // keep candidate otherwise
    } catch (e) {
      // continue
    }

    // 2) pdf-parse (fast parse)
    // try {
    //   const out2 = await extractWithPdfParse(buffer);
    //   const score2 = textQualityScore(out2);
    //   if (score2 >= 30) return out2;
    // } catch (e) { /* ignore */ }

    // 3) pdf2json fallback
    try {
      const out3 = await extractWithPdf2Json(buffer);
      const score3 = textQualityScore(out3);
      if (score3 >= 20) return out3;
    } catch(e){}

    // 4) pick best candidate available
    const candidates = [];
    try { candidates.push(await extractWithPdfJsLayout(buffer)); } catch(_) {}
    // try { candidates.push(await extractWithPdfParse(buffer)); } catch(_) {}
    try { candidates.push(await extractWithPdf2Json(buffer)); } catch(_) {}
    let best = candidates.sort((a,b)=> (b.split(/\s+/).filter(Boolean).length) - (a.split(/\s+/).filter(Boolean).length))[0] || "";
    if (best && best.split(/\s+/).filter(Boolean).length >= 5) return best;

    // save raw debug
    saveDebugBuffer(buffer, "pdf_fallback");
    return "";
  } catch (err) {
    console.error("extractTextFromPdf ERROR:", err.message || err);
    return "";
  }
}

