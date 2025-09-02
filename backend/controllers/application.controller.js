import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import OpenAI from "openai";
import { extractTextFromPdf } from "../utils/pdfParser.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
};


export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
 
        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
// admin dekhega kitna user ne apply kiya hai
// export const getApplicants = async (req,res) => {
//     try {
//         const jobId = req.params.id;
//         const job = await Job.findById(jobId).populate({
//             path:'applications',
//             options:{sort:{createdAt:-1}},
//             populate:{
//                 path:'applicant'
//             }
//         });
//         if(!job){
//             return res.status(404).json({
//                 message:'Job not found.',
//                 success:false
//             })
//         };
//         const jobText = `
//       Title: ${job.title}.
//       Description: ${job.description}.
//       Requirements: ${job.requirements.join(", ")}.
//       Experience Level: ${job.experienceLevel}.
//     `;

//     const jobEmbedding = await getEmbedding(jobText);
    


//     } catch (error) {
//         console.log(error);
//     }
// }
export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
    }
}



// export const getApplicants = async (req, res) => {
//   try {
//     const jobId = req.params.id;

//     // 1) Load job with populated applications
//     let job = await Job.findById(jobId)
//       .populate({
//         path: "applications",
//         options: { sort: { createdAt: -1 } },
//         populate: { path: "applicant" }
//       })
//       .lean();

//     if (!job) {
//       return res.status(404).json({ message: "Job not found.", success: false });
//     }

//     // 2) Job sections
//     const jobSections = {
//       description: job.description || "",
//       requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : "",
//       experience: job.experienceLevel || ""
//     };

//     // 3) Embeddings for each job section
//     const jobEmbeddings = {};
//     for (const [key, value] of Object.entries(jobSections)) {
//       jobEmbeddings[key] = value ? await getEmbedding(value) : null;
//     }

//     let scoredApplications = [];

//     // 4) Iterate applications
//     for (const app of job.applications) {
//       try {
//         const user = app.applicant || app.userId || app.user;
//         if (!user || !user?.profile?.resume) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }

//         // ---- Extract sections from resume ----
//         const resumeText = await extractTextFromPdf(user.profile.resume);

//         // Dummy split function (replace with NLP/regex for better accuracy)
//         const resumeSections = {
//           education: extractSection(resumeText, "Education"),
//           experience: extractSection(resumeText, "Experience"),
//           skills: extractSection(resumeText, "Skills"),
//           projects: extractSection(resumeText, "Projects"),
//         };

//         // ---- Section-wise embeddings ----
//         const resumeEmbeddings = {};
//         for (const [key, value] of Object.entries(resumeSections)) {
//           resumeEmbeddings[key] = value ? await getEmbedding(value) : null;
//         }

//         // ---- Calculate similarity section-wise ----
//         let similarities = [];
//         if (jobEmbeddings.requirements && resumeEmbeddings.skills) {
//           similarities.push(cosineSimilarity(jobEmbeddings.requirements, resumeEmbeddings.skills));
//         }
//         if (jobEmbeddings.experience && resumeEmbeddings.experience) {
//           similarities.push(cosineSimilarity(jobEmbeddings.experience, resumeEmbeddings.experience));
//         }
//         if (jobEmbeddings.description && resumeEmbeddings.projects) {
//           similarities.push(cosineSimilarity(jobEmbeddings.description, resumeEmbeddings.projects));
//         }
//         // if (jobEmbeddings.title && resumeEmbeddings.education) {
//         //   similarities.push(cosineSimilarity(jobEmbeddings.title, resumeEmbeddings.education));
//         // }

//         // ---- Final Score (average of section similarities) ----
//         const avgSim = similarities.length
//           ? similarities.reduce((a, b) => a + b, 0) / similarities.length
//           : 0;

//         const score = Number((avgSim * 100).toFixed(2));

//         scoredApplications.push({
//           ...app,
//           score
//         });

//       } catch (err) {
//         console.error(`Error scoring application ${app._id}:`, err.message || err);
//         scoredApplications.push({ ...app, score: null });
//       }
//     }

//     // 5) Replace applications
//     job.applications = scoredApplications;
//     return res.status(200).json({ job, success: true });

//   } catch (error) {
//     console.error("getApplicants error:", error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }

// // Helper: extract section (simple version, better to use NLP)
// function extractSection(text, keyword) {
//   const regex = new RegExp(`${keyword}[\\s\\S]*?(?=Education|Experience|Skills|Projects|$)`, "i");
//   const match = text.match(regex);
//   return match ? match[0] : "";
// }

// // };









// export const getApplicants = async (req, res) => {
//   try {
//     const jobId = req.params.id;

//     // 1) Load job with populated applications
//     let job = await Job.findById(jobId)
//       .populate({
//         path: "applications",
//         options: { sort: { createdAt: -1 } },
//         populate: { path: "applicant" }
//       })
//       .lean();

//     if (!job) {
//       return res.status(404).json({ message: "Job not found.", success: false });
//     }

//     // 2) Job sections
//     const jobSections = {
//       description: job.description || "",
//       requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : "",
//       experience: job.experienceLevel || ""
//     };

//     // 3) Embeddings for each job section
//     const jobEmbeddings = {};
//     for (const [key, value] of Object.entries(jobSections)) {
//       // jobEmbeddings[key] = value ? await getEmbedding(value) : null;
//     }

//     let scoredApplications = [];

//     // 4) Iterate applications
//     for (const app of job.applications) {
//       try {
//         const user = app.applicant || app.userId || app.user;
//         if (!user || !user?.profile?.resume) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }

//         // ---- Extract sections from resume ----
//         const resumeText = await extractTextFromPdf(user.profile.resume);
//         const resumeSections = {
//           education: extractSection(resumeText, "Education"),
//           experience: extractSection(resumeText, "Experience"),
//           skills: extractSection(resumeText, "Skills|Technical Skills|Coursework"),
//           projects: extractSection(resumeText, "Projects"),
//         };

//         // ---- Custom parsing ----
//         // ---- Custom parsing ----
// const totalExperienceYears = calculateExperienceDuration(resumeSections.experience);

// // Compare skills
// const { overlapPercent, matchedSkills } = compareSkills(
//   jobSections.requirements,
//   resumeSections.skills
// );

// // ---- Section-wise embeddings ----
// const resumeEmbeddings = {};
// for (const [key, value] of Object.entries(resumeSections)) {
//   // resumeEmbeddings[key] = value ? await getEmbedding(value) : null;
// }

// // ---- Calculate similarity section-wise ----
// const sectionScores = {};

// // Skills similarity
// if (jobEmbeddings.requirements && resumeEmbeddings.skills) {
//   sectionScores.requirementsMatch = cosineSimilarity(jobEmbeddings.requirements, resumeEmbeddings.skills);
// }

// // ✅ Experience numeric comparison
// let expScore = 0;
// if (jobSections.experience && totalExperienceYears) {
//   const required = Number(jobSections.experience);
//   const candidate = Number(totalExperienceYears);
//   if (candidate >= required) {
//     expScore = 1; // perfect match
//   } else {
//     expScore = candidate / required; // proportional
//   }
// }
// sectionScores.experienceMatch = expScore;

// // Embedding similarity for description ↔ projects
// if (jobEmbeddings.description && resumeEmbeddings.projects) {
//   sectionScores.projectsMatch = cosineSimilarity(jobEmbeddings.description, resumeEmbeddings.projects);
// }

// // Optional: education
// if (jobEmbeddings.title && resumeEmbeddings.education) {
//   sectionScores.educationMatch = cosineSimilarity(jobEmbeddings.title, resumeEmbeddings.education);
// }

// // ---- Final Score ----
// const values = Object.values(sectionScores).filter(v => typeof v === "number");
// const avgSim = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
// const score = Number((avgSim * 100).toFixed(2));

// // ---- Push result ----
// scoredApplications.push({
//   ...app,
//   score,
//   details: {
//     sectionScores,
//     calculatedExperienceYears: totalExperienceYears,
//     skillsOverlap: matchedSkills,
//     skillsOverlapPercent: overlapPercent
//   }
// });


//       } catch (err) {
//         console.error(`Error scoring application ${app._id}:`, err.message || err);
//         scoredApplications.push({ ...app, score: null });
//       }
//     }

//     // 5) Replace applications
//     job.applications = scoredApplications;
//     return res.status(200).json({ job, success: true });

//   } catch (error) {
//     console.error("getApplicants error:", error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// ---- Helpers ----

// Section extractor
// function extractSection(text, keyword) {
//   const regex = new RegExp(`${keyword}[\\s\\S]*?(?=Education|Experience|Skills|Projects|Achievements|$)`, "i");
//   const match = text.match(regex);
//   return match ? match[0] : "";
// }

// // Calculate total experience in years
// function calculateExperienceDuration(expText) {
//   if (!expText) return 0;
//   const regex = /(\d{2}\/\d{4})\s*[-–]\s*(Present|\d{2}\/\d{4})/g;
//   let totalMonths = 0;

//   let match;
//   while ((match = regex.exec(expText)) !== null) {
//     const start = parseDate(match[1]);
//     const end = match[2] === "Present" ? new Date() : parseDate(match[2]);
//     totalMonths += monthDiff(start, end);
//   }
//   return (totalMonths / 12).toFixed(1); // years
// }

// function parseDate(str) {
//   const [month, year] = str.split("/").map(Number);
//   return new Date(year, month - 1);
// }

// function monthDiff(d1, d2) {
//   return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
// }

// // Compare skills
// function compareSkills(jobReqs, resumeSkills) {
//   if (!jobReqs || !resumeSkills) return { overlapPercent: 0, matchedSkills: [] };

//   const jobList = jobReqs.toLowerCase().split(/[,|]/).map(s => s.trim());
//   const resumeList = resumeSkills.toLowerCase().split(/[,|]/).map(s => s.trim());

//   const matched = jobList.filter(skill => resumeList.includes(skill));
//   const overlapPercent = ((matched.length / jobList.length) * 100).toFixed(2);

//   return { overlapPercent, matchedSkills: matched };
// }




























// Assumes these imports exist elsewhere in your project:
// import { getEmbedding } from "../services/embedding.service.js";
// import { extractTextFromPdf } from "../utils/pdfParser.js";
// import { cosineSimilarity } from "../utils/cosineSimilarity.js";

// export const getApplicants = async (req, res) => {
//   try {
//     console.log("insiode try");
//     const jobId = req.params.id;

//     // 1) Load job with populated applications
//     let job = await Job.findById(jobId)
//       .populate({
//         path: "applications",
//         options: { sort: { createdAt: -1 } },
//         populate: { path: "applicant" }
//       })
//       .lean();

//     if (!job) {
//       return res.status(404).json({ message: "Job not found.", success: false });
//     }

//     // 2) Job sections (include title too so education match can run)
//     const jobSections = {
//       title: job.title || "",
//       description: job.description || "",
//       requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : (job.requirements || ""),
//       experience: (job.experience !== undefined && job.experience !== null) ? job.experience : (job.experienceLevel || "")
//     };
// console.log("before jobembedding");
//     // 3) Embeddings for each job section
//     const jobEmbeddings = {};
//     // for (const [key, value] of Object.entries(jobSections)) {
//     //   jobEmbeddings[key] = value ? await getEmbedding(value) : null;
//     // }

//     let scoredApplications = [];

//     // 4) Iterate applications
//     for (const app of job.applications) {
//       try {
//         const user = app.applicant || app.userId || app.user;
//         if (!user || !user?.profile?.resume) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }
// console.log("inside for loop");
//         console.log("Resume URL/Path:", user.profile.resume);
//         // ---- Extract sections from resume ----
//         const resumeText = await extractTextFromPdf(user.profile.resume);

//         const resumeSections = {
//           education: extractSection(resumeText, "Education|Academic|Qualifications"),
//           experience: extractSection(resumeText, "Experience|Work Experience|Employment History|Professional Experience"),
//           skills: extractSection(resumeText, "Skills|Technical Skills|Skill Set|Coursework"),
//           projects: extractSection(resumeText, "Projects|Work|Project"),
//         };


//         console.log(resumeSections);
//         // ---- Custom parsing ----
//         const totalExperienceYears = calculateExperienceDuration(resumeSections.experience);
//         console.log("hggggggggggggggggggggggggggjjed",totalExperienceYears);

//         // Compare skills
//         const { overlapPercent, matchedSkills } = compareSkills(
//           jobSections.requirements,
//           resumeSections.skills
//         );

//         // ---- Section-wise embeddings ----
//         const resumeEmbeddings = {};
//         for (const [key, value] of Object.entries(resumeSections)) {
//           // resumeEmbeddings[key] = value ? await getEmbedding(value) : null;
//         }

//         // ---- Calculate similarity section-wise ----
//         const sectionScores = {};

//         // Skills similarity (job requirements vs resume skills section)
//         if (jobEmbeddings.requirements && resumeEmbeddings.skills) {
//           sectionScores.requirementsMatch = cosineSimilarity(jobEmbeddings.requirements, resumeEmbeddings.skills);
//         }

//         // ✅ Experience numeric comparison (uses jobSections.experience as a number)
//         let expScore = 0;
//         if (jobSections.experience && totalExperienceYears) {
//           const required = Number(jobSections.experience);
//           const candidate = Number(totalExperienceYears);
//           if (!isNaN(required) && required > 0) {
//             if (candidate >= required) {
//               expScore = 1; // perfect match
//             } else {
//               expScore = candidate / required; // proportional
//             }
//           } else {
//             // If job's experience isn't a reliable number, but embeddings exist, we can fallback later
//             expScore = 0;
//           }
//         }
//         sectionScores.experienceMatch = expScore;

//         // Embedding similarity for description ↔ projects
//         if (jobEmbeddings.description && resumeEmbeddings.projects) {
//           sectionScores.projectsMatch = cosineSimilarity(jobEmbeddings.description, resumeEmbeddings.projects);
//         }

//         // Education / title similarity (optional)
//         if (jobEmbeddings.title && resumeEmbeddings.education) {
//           sectionScores.educationMatch = cosineSimilarity(jobEmbeddings.title, resumeEmbeddings.education);
//         }

//         // ---- Final Score ----
//         const values = Object.values(sectionScores).filter(v => typeof v === "number");
//         const avgSim = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
//         const score = Number((avgSim * 100).toFixed(2));

//         // ---- Push result ----
//         scoredApplications.push({
//           ...app,
//           score,
//           details: {
//             sectionScores,
//             calculatedExperienceYears: totalExperienceYears,
//             skillsOverlap: matchedSkills,
//             skillsOverlapPercent: overlapPercent
//           }
//         });

//       } catch (err) {
//         console.error(`Error scoring application ${app._id}:`, err.message || err);
//         scoredApplications.push({ ...app, score: null });
//       }
//     }

//     // 5) Replace applications
//     console.log("jhf tcrtyvukluytjrerzqwxrctyu",scoredApplications);
//     // job.applications = scoredApplications;
//     return res.status(200).json({ job, success: true });

//   } catch (error) {
//     console.error("getApplicants error:", error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// // ---- Helpers ----

// // Normalize text and split into lines, then detect headings robustly and return the section (heading + body)
// function extractSection(text = "", keywordPattern = "") {
//   if (!text || !keywordPattern) return "";

//   // Normalize text
//   const cleaned = text.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/[•·▪]/g, "\n");
//   const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);

//   // Build heading tokens: include user-provided tokens and common ones
//   const keywordTokens = keywordPattern.split("|").map(k => k.trim()).filter(Boolean);
//   const commonHeadings = [
//     "education", "experience", "work experience", "professional experience", "employment history",
//     "skills", "technical skills", "skill set", "coursework",
//     "projects", "achievements", "certifications", "summary", "objective"
//   ];
//   const tokensSet = new Set([...keywordTokens.map(t => t.toLowerCase()), ...commonHeadings]);

//   // compile regexes for tokens (word boundary)
//   const tokenRegexes = Array.from(tokensSet).map(t => {
//     const esc = escapeRegex(t);
//     return new RegExp(`\\b${esc}\\b`, "i");
//   });

//   // find first line that looks like our heading
//   let startIndex = -1;
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     // If line matches any heading token exactly or contains it as a word, consider it a heading
//     for (const r of tokenRegexes) {
//       if (r.test(line)) {
//         startIndex = i;
//         break;
//       }
//     }
//     if (startIndex !== -1) break;
//   }
// console.log("theek chal rha");
//   if (startIndex === -1) {
//     // Fallback to regex-based approach (original style) if heading not found
//     try {
//       const fallbackRegex = new RegExp(`${keywordPattern}[\\s\\S]*?(?=Education|Experience|Skills|Projects|Achievements|Certifications|$)`, "i");
//       const match = text.match(fallbackRegex);
//       return match ? match[0].trim() : "";
//     } catch (e) {
//       console.log("erro came");
//       return "";
//     }
//   }

//   // find next heading after startIndex
//   let endIndex = lines.length;
//   for (let j = startIndex + 1; j < lines.length; j++) {
//     for (const r of tokenRegexes) {
//       if (r.test(lines[j])) {
//         endIndex = j;
//         break;
//       }
//     }
//     if (endIndex !== lines.length) break;
//   }

//   // return text from heading line to the line before next heading
//   const selected = lines.slice(startIndex, endIndex).join("\n");
//   return selected;
// }

// function escapeRegex(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// // Calculate total experience in years (number) using robust parsing and merging intervals
// function calculateExperienceDuration(expText) {
//   if (!expText || !expText.trim()) return 0;

//   // Clean obvious noisy characters and unify dashes
//   const cleaned = expText
//     .replace(/[’'"]/g, "")        // remove quotes/apostrophes
//     .replace(/–|—/g, "-")         // normalize dashes to hyphen
//     .replace(/\s+to\s+/gi, "-")   // "to" -> hyphen
//     .replace(/·|•/g, "\n")        // bullets into newlines
//     .replace(/\r/g, "\n");

//   // Find all "range-like" patterns around a hyphen: "something - something"
//   const rangePattern = /([A-Za-z]{3,9}\s*\d{4}|\d{1,2}[\/\-\.]\d{4}|\d{4})\s*-\s*(Present|present|current|now|[A-Za-z]{3,9}\s*\d{4}|\d{1,2}[\/\-\.]\d{4}|\d{4})/gi;
//   const intervals = [];

//   let m;
//   while ((m = rangePattern.exec(cleaned)) !== null) {
//     const left = m[1].trim();
//     const right = m[2].trim();

//     const startDate = parseDateString(left, false);
//     const endDate = /^(present|current|now)$/i.test(right) ? new Date() : parseDateString(right, true);

//     if (startDate && endDate && startDate <= endDate) {
//       const startIndex = startDate.getFullYear() * 12 + startDate.getMonth();
//       const endIndex = endDate.getFullYear() * 12 + endDate.getMonth();
//       intervals.push([startIndex, endIndex]);
//     }
//   }

//   // If no intervals found, fallback to detecting patterns like "2 years", "1.5 yrs"
//   if (intervals.length === 0) {
//     const durRegex = /(\d+(\.\d+)?)\s*(?:years|yrs|year)/i;
//     const found = cleaned.match(durRegex);
//     if (found) {
//       return Number(parseFloat(found[1]).toFixed(1));
//     }
//     return 0;
//   }

//   // Merge overlapping intervals (sort by start)
//   intervals.sort((a, b) => a[0] - b[0]);
//   const merged = [];
//   let [curStart, curEnd] = intervals[0];

//   for (let i = 1; i < intervals.length; i++) {
//     const [s, e] = intervals[i];
//     if (s <= curEnd) {
//       // overlap or contiguous: extend end
//       curEnd = Math.max(curEnd, e);
//     } else {
//       merged.push([curStart, curEnd]);
//       curStart = s;
//       curEnd = e;
//     }
//   }
//   merged.push([curStart, curEnd]);

//   // Sum months using exclusive difference (to match original monthDiff behavior)
//   let totalMonths = 0;
//   for (const [s, e] of merged) {
//     const months = e - s; // exclusive, matches earlier monthDiff logic
//     if (months > 0) totalMonths += months;
//   }

//   // Convert to years with one decimal
//   const years = Number((totalMonths / 12).toFixed(1));
//   return years;
// }

// // Parse a token like "01/2024", "1/2024", "Apr 2025", "April 2025", "2024"
// // isEnd indicates if this token is the right-side of a range (if it's a bare year, treat as Dec for end)
// function parseDateString(token, isEnd = false) {
//   if (!token) return null;
//   const t = token.trim();

//   // mm/yyyy or m/yyyy or mm-yyyy or mm.yyyy
//   let m = t.match(/^(\d{1,2})[\/\-.](\d{4})$/);
//   if (m) {
//     const month = Math.min(12, Math.max(1, parseInt(m[1], 10)));
//     const year = parseInt(m[2], 10);
//     return new Date(year, month - 1);
//   }

//   // MonthName YYYY -> accept Jan, January, sep., Sept etc.
//   m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/i);
//   if (m) {
//     const mon = m[1].toLowerCase().slice(0, 3);
//     const monthMap = {
//       jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
//       jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
//     };
//     const month = monthMap[mon];
//     const year = parseInt(m[2], 10);
//     if (month === undefined) return null;
//     return new Date(year, month);
//   }

//   // Bare year e.g. 2020
//   m = t.match(/^(\d{4})$/);
//   if (m) {
//     const year = parseInt(m[1], 10);
//     // If it's the end token of a range, treat as Dec (month 11) to represent end of that year.
//     // If start token (isEnd=false) treat as Jan (month 0).
//     return isEnd ? new Date(year, 11) : new Date(year, 0);
//   }

//   return null;
// }

// // Compare skills: normalize lists, split by typical separators
// function compareSkills(jobReqs = "", resumeSkills = "") {
//   if (!jobReqs || !resumeSkills) return { overlapPercent: 0, matchedSkills: [] };

//   const normalizeList = (s) => {
//     return s
//       .replace(/[\r\n••·]/g, ",")
//       .split(/[,;|\n\/•\-]+/)
//       .map(x => x.trim().toLowerCase())
//       .filter(Boolean)
//       .map(x => x.replace(/[^a-z0-9\+\#\.\s]/g, "")); // keep common chars
//   };

//   const jobList = Array.from(new Set(normalizeList(jobReqs)));
//   const resumeList = Array.from(new Set(normalizeList(resumeSkills)));

//   if (jobList.length === 0) return { overlapPercent: 0, matchedSkills: [] };

//   const matched = jobList.filter(skill => resumeList.includes(skill));
//   const overlapPercent = Number(((matched.length / jobList.length) * 100).toFixed(2));

//   return { overlapPercent, matchedSkills: matched };
// }
















// getApplicants.js (updated)

// import Job from "./models/Job"; // adjust path as necessary
// import { extractTextFromPdf } from "./pdfUtils"; // your existing extractor
// // other imports...

// export const getApplicants = async (req, res) => {
//   try {
//     console.log("insiode try");
//     const jobId = req.params.id;

//     // 1) Load job with populated applications
//     let job = await Job.findById(jobId)
//       .populate({
//         path: "applications",
//         options: { sort: { createdAt: -1 } },
//         populate: { path: "applicant" }
//       })
//       .lean();

//     if (!job) {
//       return res.status(404).json({ message: "Job not found.", success: false });
//     }

//     // 2) Job sections (include title too so education match can run)
//     const jobSections = {
//       title: job.title || "",
//       description: job.description || "",
//       requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : (job.requirements || ""),
//       experience: (job.experience !== undefined && job.experience !== null) ? job.experience : (job.experienceLevel || "")
//     };
//     console.log("before jobembedding");

//     let scoredApplications = [];

//     // 3) Iterate applications
//     for (const app of job.applications) {
//       try {
//         const user = app.applicant || app.userId || app.user;
//         if (!user || !user?.profile?.resume) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }
//         console.log("inside for loop");
//         console.log("Resume URL/Path:", user.profile.resume);

//         // ---- Extract raw text from resume ----
//         const resumeText = await extractTextFromPdf(user.profile.resume);
//         if (!resumeText || !resumeText.trim()) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }

//         // ---- Extract sections using canonical keys ----
//         const resumeSections = {
//           education: extractSection(resumeText, "education"),
//           experience: extractSection(resumeText, "experience"),
//           skills: extractSection(resumeText, "skills"),
//           projects: extractSection(resumeText, "projects")
//         };

//         console.log("Parsed resumeSections:", resumeSections);

//         // ---- Custom parsing ----
//         const totalExperienceYears = calculateExperienceDuration(resumeSections.experience);
//         console.log("Calculated experience (years):", totalExperienceYears);

//         // Compare skills
//         const { overlapPercent, matchedSkills } = compareSkills(
//           jobSections.requirements,
//           resumeSections.skills
//         );

//         // Simple scoring logic (adjust weights later)
//         let score = null;
//         const skillScore = overlapPercent / 100; // 0..1
//         let expScore = 0;
//         const requiredExp = Number(jobSections.experience);
//         if (!isNaN(requiredExp) && requiredExp > 0) {
//           expScore = Math.min(1, (totalExperienceYears || 0) / requiredExp);
//           // combine skills and experience equally
//           score = Number(((skillScore * 0.6 + expScore * 0.4) * 100).toFixed(2));
//         } else {
//           // if job doesn't specify numeric experience, rely on skills only
//           score = Number((skillScore * 100).toFixed(2));
//         }

//         scoredApplications.push({
//           ...app,
//           score,
//           details: {
//             calculatedExperienceYears: totalExperienceYears,
//             skillsOverlapPercent: overlapPercent,
//             matchedSkills,
//             parsedSections: resumeSections
//           }
//         });

//       } catch (err) {
//         console.error(`Error scoring application ${app._id}:`, err.message || err);
//         scoredApplications.push({ ...app, score: null });
//       }
//     }

//     // 5) Attach scored applications or return separately
//     job.applications = scoredApplications;
//     return res.status(200).json({ job, success: true });

//   } catch (error) {
//     console.error("getApplicants error:", error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// // ------------------ Helpers ------------------

// // Simple section extractor using regex patterns
// function extractSection(text = "", targetKey = "") {
//   if (!text || !targetKey) return "";

//   const key = targetKey.toLowerCase();
//   let pattern;

//   // Define specific patterns for each section based on the actual resume format
//   switch (key) {
//     case 'education':
//       pattern = /EDUCATION[\s\S]*?(?=COURSEWORK\/SKILLS|$)/i;
//       break;
//     case 'skills':
//       pattern = /(COURSEWORK\/SKILLS[\s\S]*?(?=PROJECTS|$))|(TECHNICAL\s*SKILLS[\s\S]*?(?=ACHIEVEMENTS|$))/i;
//       break;
//     case 'projects':
//       pattern = /PROJECTS[\s\S]*?(?=TECHNICAL\s*SKILLS|$)/i;
//       break;
//     case 'experience':
//       pattern = /POSITION\s*OF\s*RESPONSIBILITY[\s\S]*?$/i;
//       break;
//     default:
//       return "";
//   }

//   const match = text.match(pattern);
//   return match ? match[0].trim() : "";
// }

// function escapeRegex(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// // Calculate total experience in years (same robust parsing with slight improvements)
// function calculateExperienceDuration(expText) {
//   if (!expText || !expText.trim()) return 0;

//   const cleaned = expText
//     .replace(/[’'"]/g, "")        // remove quotes/apostrophes
//     .replace(/–|—/g, "-")         // normalize dashes to hyphen
//     .replace(/\s+to\s+/gi, "-")   // "to" -> hyphen
//     .replace(/·|•/g, "\n")        // bullets into newlines
//     .replace(/\r/g, "\n");

//   // Wide range pattern: "Jan 2020 - Dec 2021", "01/2020 - Present", "2019 - 2021"
//   const rangePattern = /([A-Za-z]{3,9}\.?\s*\d{4}|\d{1,2}[\/\-\.]\d{4}|\d{4})\s*[-–—]\s*(Present|present|current|now|[A-Za-z]{3,9}\.?\s*\d{4}|\d{1,2}[\/\-\.]\d{4}|\d{4})/gi;
//   const intervals = [];

//   let m;
//   while ((m = rangePattern.exec(cleaned)) !== null) {
//     const left = m[1].trim();
//     const right = m[2].trim();

//     const startDate = parseDateString(left, false);
//     const endDate = /^(present|current|now)$/i.test(right) ? new Date() : parseDateString(right, true);

//     if (startDate && endDate && startDate <= endDate) {
//       const startIndex = startDate.getFullYear() * 12 + startDate.getMonth();
//       const endIndex = endDate.getFullYear() * 12 + endDate.getMonth();
//       intervals.push([startIndex, endIndex]);
//     }
//   }

//   // If no intervals found, fallback to detecting durations like "2 years" or "18 months"
//   if (intervals.length === 0) {
//     const durRegexYears = /(\d+(\.\d+)?)\s*(?:years|yrs|year)/i;
//     const durRegexMonths = /(\d+)\s*(?:months|mos|month)/i;
//     const foundY = cleaned.match(durRegexYears);
//     if (foundY) return Number(parseFloat(foundY[1]).toFixed(1));
//     const foundM = cleaned.match(durRegexMonths);
//     if (foundM) return Number((parseInt(foundM[1], 10) / 12).toFixed(1));
//     return 0;
//   }

//   // Merge overlapping intervals
//   intervals.sort((a, b) => a[0] - b[0]);
//   const merged = [];
//   let [curStart, curEnd] = intervals[0];

//   for (let i = 1; i < intervals.length; i++) {
//     const [s, e] = intervals[i];
//     if (s <= curEnd) {
//       curEnd = Math.max(curEnd, e);
//     } else {
//       merged.push([curStart, curEnd]);
//       curStart = s;
//       curEnd = e;
//     }
//   }
//   merged.push([curStart, curEnd]);

//   // Sum months using exclusive difference
//   let totalMonths = 0;
//   for (const [s, e] of merged) {
//     const months = e - s; // exclusive
//     if (months > 0) totalMonths += months;
//   }

//   const years = Number((totalMonths / 12).toFixed(1));
//   return years;
// }

// // Parse date like "01/2024", "Apr 2025", "2024"
// function parseDateString(token, isEnd = false) {
//   if (!token) return null;
//   const t = token.trim();

//   // mm/yyyy or m/yyyy or mm-yyyy or mm.yyyy
//   let m = t.match(/^(\d{1,2})[\/\-.](\d{4})$/);
//   if (m) {
//     const month = Math.min(12, Math.max(1, parseInt(m[1], 10)));
//     const year = parseInt(m[2], 10);
//     return new Date(year, month - 1);
//   }

//   // MonthName YYYY -> accept Jan, January, sep., Sept etc.
//   m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/i);
//   if (m) {
//     const mon = m[1].toLowerCase().slice(0, 3);
//     const monthMap = {
//       jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
//       jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
//     };
//     const month = monthMap[mon];
//     const year = parseInt(m[2], 10);
//     if (month === undefined) return null;
//     return new Date(year, month);
//   }

//   // Bare year e.g. 2020
//   m = t.match(/^(\d{4})$/);
//   if (m) {
//     const year = parseInt(m[1], 10);
//     return isEnd ? new Date(year, 11) : new Date(year, 0);
//   }

//   return null;
// }

// // Compare skills: normalize lists, split by typical separators
// function compareSkills(jobReqs = "", resumeSkills = "") {
//   if (!jobReqs || !resumeSkills) return { overlapPercent: 0, matchedSkills: [] };

//   const normalizeList = (s) => {
//     return s
//       .replace(/[\r\n••·]/g, ",")
//       .split(/[,;|\n\/•\-]+/)
//       .map(x => x.trim())
//       .filter(Boolean)
//       .map(x => x.toLowerCase().replace(/[^a-z0-9\+\#\.\s]/g, "")); // keep common chars
//   };

//   const jobList = Array.from(new Set(normalizeList(jobReqs)));
//   const resumeList = Array.from(new Set(normalizeList(resumeSkills)));

//   if (jobList.length === 0) return { overlapPercent: 0, matchedSkills: [] };

//   const matched = jobList.filter(skill => resumeList.includes(skill));
//   const overlapPercent = Number(((matched.length / jobList.length) * 100).toFixed(2));

//   return { overlapPercent, matchedSkills: matched };
// }
























// export const getApplicants = async (req, res) => {
//   try {
//     console.log("insiode try");
//     const jobId = req.params.id;

//     // 1) Load job with populated applications
//     let job = await Job.findById(jobId)
//       .populate({
//         path: "applications",
//         options: { sort: { createdAt: -1 } },
//         populate: { path: "applicant" }
//       })
//       .lean();

//     if (!job) {
//       return res.status(404).json({ message: "Job not found.", success: false });
//     }

//     // 2) Job sections (include title too so education match can run)
//     const jobSections = {
//       title: job.title || "",
//       description: job.description || "",
//       requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : (job.requirements || ""),
//       experience: (job.experience !== undefined && job.experience !== null) ? job.experience : (job.experienceLevel || "")
//     };
//     console.log("before jobembedding");

//     let scoredApplications = [];

//     // 3) Iterate applications
//     for (const app of job.applications) {
//       try {
//         const user = app.applicant || app.userId || app.user;
//         if (!user || !user?.profile?.resume) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }
//         console.log("inside for loop");
//         console.log("Resume URL/Path:", user.profile.resume);

//         // ---- Extract raw text from resume ----
//         const resumeText = await extractTextFromPdf(user.profile.resume);
//         if (!resumeText || !resumeText.trim()) {
//           scoredApplications.push({ ...app, score: null });
//           continue;
//         }

//         // ---- Extract sections using canonical keys ----
//         const resumeSections = {
//           education: extractSection(resumeText, "education"),
//           experience: extractSection(resumeText, "experience"),
//           skills: extractSection(resumeText, "skills"),
//           projects: extractSection(resumeText, "projects")
//         };

//         console.log("Parsed resumeSections:", resumeSections);

//         // ---- Custom parsing ----
//         const totalExperienceYears = calculateExperienceDuration(resumeSections.experience);
//         console.log("Calculated experience (years):", totalExperienceYears);

//         // Compare skills
//         const { overlapPercent, matchedSkills } = compareSkills(
//           jobSections.requirements,
//           resumeSections.skills
//         );

//         // Simple scoring logic (adjust weights later)
//         let score = null;
//         const skillScore = overlapPercent / 100; // 0..1
//         let expScore = 0;
//         const requiredExp = Number(jobSections.experience);
//         if (!isNaN(requiredExp) && requiredExp > 0) {
//           expScore = Math.min(1, (totalExperienceYears || 0) / requiredExp);
//           // combine skills and experience equally
//           score = Number(((skillScore * 0.6 + expScore * 0.4) * 100).toFixed(2));
//         } else {
//           // if job doesn't specify numeric experience, rely on skills only
//           score = Number((skillScore * 100).toFixed(2));
//         }

//         scoredApplications.push({
//           ...app,
//           score,
//           details: {
//             calculatedExperienceYears: totalExperienceYears,
//             skillsOverlapPercent: overlapPercent,
//             matchedSkills,
//             parsedSections: resumeSections
//           }
//         });

//       } catch (err) {
//         console.error(`Error scoring application ${app._id}:`, err.message || err);
//         scoredApplications.push({ ...app, score: null });
//       }
//     }

//     // 5) Attach scored applications or return separately
//     job.applications = scoredApplications;
//     return res.status(200).json({ job, success: true });

//   } catch (error) {
//     console.error("getApplicants error:", error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// // ------------------ Helpers ------------------

// // Robust section extractor
// function extractSection(text = "", targetKey = "") {
//   if (!text || !targetKey) return "";

//   // Normalize text: keep original but create cleaned version for line splitting and matching
//   const normalized = text
//     .replace(/\r/g, "\n")
//     .replace(/[•·▪•]/g, "\n")     // bullets -> newlines
//     .replace(/\t/g, " ")
//     .replace(/\u00A0/g, " ")      // non-breaking spaces
//     .replace(/ {2,}/g, " ");      // collapse multi-spaces

//   // Split into lines (keep original trimmed lines)
//   const rawLines = normalized.split("\n").map(l => l.trim()).filter(Boolean);
//   if (rawLines.length === 0) return "";

//   // canonical heading variants map
//   const headingVariants = {
//     education: ["education", "educational", "academics", "academic", "qualification", "qualifications"],
//     experience: ["experience", "work experience", "employment history", "professional experience", "work history", "positions", "roles"],
//     skills: ["skills", "technical skills", "skill set", "coursework", "coursework / skills", "areas of expertise"],
//     projects: ["projects", "project", "personal projects", "academic projects", "selected projects", "notable projects"],
//     achievements: ["achievements", "honors", "awards"],
//     certifications: ["certifications", "certificates", "licenses"]
//   };

//   // Build a list of heading indices present in the document
//   const headingsFound = []; // { idx, key, line }
//   const lowerLines = rawLines.map(l => l.toLowerCase());

//   // helper: check if a line matches a token (fuzzy: includes or regex word boundary)
//   const lineMatchesToken = (lineLower, token) => {
//     if (!token) return false;
//     const t = token.toLowerCase().replace(/\s+/g, " ").trim();
//     // direct include (covers "coursework / skills", "skills & tools", etc.)
//     if (lineLower.includes(t)) return true;
//     // word-boundary regex fallback
//     try {
//       const rx = new RegExp(`\\b${escapeRegex(t)}\\b`, "i");
//       return rx.test(lineLower);
//     } catch (e) {
//       return false;
//     }
//   };

//   // scan lines for any known heading tokens
//   for (let i = 0; i < lowerLines.length; i++) {
//     const ln = lowerLines[i];
//     for (const [key, tokens] of Object.entries(headingVariants)) {
//       for (const token of tokens) {
//         if (lineMatchesToken(ln, token)) {
//           // avoid duplicates (keep first occurrence for each heading)
//           const exists = headingsFound.find(h => h.key === key && h.idx === i);
//           if (!exists) headingsFound.push({ idx: i, key, line: rawLines[i] });
//           break;
//         }
//       }
//     }
//   }

//   // sort headings by index (should already be in order but keep safe)
//   headingsFound.sort((a, b) => a.idx - b.idx);

//   // find the heading entry for targetKey
//   const desiredKey = targetKey.toLowerCase();
//   let headingEntry = headingsFound.find(h => h.key === desiredKey);

//   // If not found by canonical map, try using tokens from the targetKey if it contains pipes or custom tokens
//   if (!headingEntry && targetKey.includes("|")) {
//     const tokens = targetKey.split("|").map(t => t.trim()).filter(Boolean);
//     for (let i = 0; i < lowerLines.length; i++) {
//       for (const token of tokens) {
//         if (lineMatchesToken(lowerLines[i], token)) {
//           headingEntry = { idx: i, key: token, line: rawLines[i] };
//           break;
//         }
//       }
//       if (headingEntry) break;
//     }
//   }

//   // If still not found: try looser search - look for any line that contains the token as a substring (common in uppercase)
//   if (!headingEntry) {
//     const fallbackTokens = headingVariants[desiredKey] || [];
//     for (let i = 0; i < lowerLines.length; i++) {
//       for (const token of fallbackTokens) {
//         if (lowerLines[i].includes(token.slice(0, Math.max(3, token.length)))) {
//           headingEntry = { idx: i, key: desiredKey, line: rawLines[i] };
//           break;
//         }
//       }
//       if (headingEntry) break;
//     }
//   }

//   // If still not found, return empty string early
//   if (!headingEntry) {
//     // final fallback: try a regex on original text (useful when headings are inline)
//     try {
//       const tokenList = (headingVariants[desiredKey] || [desiredKey]).map(escapeRegex).join("|");
//       const fallbackRegex = new RegExp(`(${tokenList})[\\s\\S]{0,800}`, "i");
//       const match = text.match(fallbackRegex);
//       return match ? match[0].trim() : "";
//     } catch (e) {
//       return "";
//     }
//   }

//   // find the next heading index after this heading (from headingsFound)
//   let nextIdx = rawLines.length;
//   for (const h of headingsFound) {
//     if (h.idx > headingEntry.idx) {
//       nextIdx = h.idx;
//       break;
//     }
//   }

//   // Use slice from headingEntry.idx to nextIdx (exclusive)
//   const selectedLines = rawLines.slice(headingEntry.idx, nextIdx);
//   const selected = selectedLines.join("\n").trim();
//   return selected;
// }

// function escapeRegex(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// // Calculate total experience in years (same robust parsing with slight improvements)
// function calculateExperienceDuration(expText) {
//   if (!expText || !expText.trim()) return 0;

//   const cleaned = expText
//     .replace(/[’'"]/g, "")        // remove quotes/apostrophes
//     .replace(/–|—/g, "-")         // normalize dashes to hyphen
//     .replace(/\s+to\s+/gi, "-")   // "to" -> hyphen
//     .replace(/·|•/g, "\n")        // bullets into newlines
//     .replace(/\r/g, "\n");

//   // Wide range pattern: "Jan 2020 - Dec 2021", "01/2020 - Present", "2019 - 2021"
//   const rangePattern = /([A-Za-z]{3,9}\.?\s*\d{4}|\d{1,2}[\/\-\.]\d{4}|\d{4})\s*[-–—]\s*(Present|present|current|now|[A-Za-z]{3,9}\.?\s*\d{4}|\d{1,2}[\/\-\.]\d{4}|\d{4})/gi;
//   const intervals = [];

//   let m;
//   while ((m = rangePattern.exec(cleaned)) !== null) {
//     const left = m[1].trim();
//     const right = m[2].trim();

//     const startDate = parseDateString(left, false);
//     const endDate = /^(present|current|now)$/i.test(right) ? new Date() : parseDateString(right, true);

//     if (startDate && endDate && startDate <= endDate) {
//       const startIndex = startDate.getFullYear() * 12 + startDate.getMonth();
//       const endIndex = endDate.getFullYear() * 12 + endDate.getMonth();
//       intervals.push([startIndex, endIndex]);
//     }
//   }

//   // If no intervals found, fallback to detecting durations like "2 years" or "18 months"
//   if (intervals.length === 0) {
//     const durRegexYears = /(\d+(\.\d+)?)\s*(?:years|yrs|year)/i;
//     const durRegexMonths = /(\d+)\s*(?:months|mos|month)/i;
//     const foundY = cleaned.match(durRegexYears);
//     if (foundY) return Number(parseFloat(foundY[1]).toFixed(1));
//     const foundM = cleaned.match(durRegexMonths);
//     if (foundM) return Number((parseInt(foundM[1], 10) / 12).toFixed(1));
//     return 0;
//   }

//   // Merge overlapping intervals
//   intervals.sort((a, b) => a[0] - b[0]);
//   const merged = [];
//   let [curStart, curEnd] = intervals[0];

//   for (let i = 1; i < intervals.length; i++) {
//     const [s, e] = intervals[i];
//     if (s <= curEnd) {
//       curEnd = Math.max(curEnd, e);
//     } else {
//       merged.push([curStart, curEnd]);
//       curStart = s;
//       curEnd = e;
//     }
//   }
//   merged.push([curStart, curEnd]);

//   // Sum months using exclusive difference
//   let totalMonths = 0;
//   for (const [s, e] of merged) {
//     const months = e - s; // exclusive
//     if (months > 0) totalMonths += months;
//   }

//   const years = Number((totalMonths / 12).toFixed(1));
//   return years;
// }

// // Parse date like "01/2024", "Apr 2025", "2024"
// function parseDateString(token, isEnd = false) {
//   if (!token) return null;
//   const t = token.trim();

//   // mm/yyyy or m/yyyy or mm-yyyy or mm.yyyy
//   let m = t.match(/^(\d{1,2})[\/\-.](\d{4})$/);
//   if (m) {
//     const month = Math.min(12, Math.max(1, parseInt(m[1], 10)));
//     const year = parseInt(m[2], 10);
//     return new Date(year, month - 1);
//   }

//   // MonthName YYYY -> accept Jan, January, sep., Sept etc.
//   m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/i);
//   if (m) {
//     const mon = m[1].toLowerCase().slice(0, 3);
//     const monthMap = {
//       jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
//       jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
//     };
//     const month = monthMap[mon];
//     const year = parseInt(m[2], 10);
//     if (month === undefined) return null;
//     return new Date(year, month);
//   }

//   // Bare year e.g. 2020
//   m = t.match(/^(\d{4})$/);
//   if (m) {
//     const year = parseInt(m[1], 10);
//     return isEnd ? new Date(year, 11) : new Date(year, 0);
//   }

//   return null;
// }

// // Compare skills: normalize lists, split by typical separators
// function compareSkills(jobReqs = "", resumeSkills = "") {
//   if (!jobReqs || !resumeSkills) return { overlapPercent: 0, matchedSkills: [] };

//   const normalizeList = (s) => {
//     return s
//       .replace(/[\r\n••·]/g, ",")
//       .split(/[,;|\n\/•\-]+/)
//       .map(x => x.trim())
//       .filter(Boolean)
//       .map(x => x.toLowerCase().replace(/[^a-z0-9\+\#\.\s]/g, "")); // keep common chars
//   };

//   const jobList = Array.from(new Set(normalizeList(jobReqs)));
//   const resumeList = Array.from(new Set(normalizeList(resumeSkills)));

//   if (jobList.length === 0) return { overlapPercent: 0, matchedSkills: [] };

//   const matched = jobList.filter(skill => resumeList.includes(skill));
//   const overlapPercent = Number(((matched.length / jobList.length) * 100).toFixed(2));

//   return { overlapPercent, matchedSkills: matched };
// }










































// most latest code

export const getApplicants = async (req, res) => {
  try {
    console.log("insiode try");
    const jobId = req.params.id;

    // 1) Load job with populated applications
    let job = await Job.findById(jobId)
      .populate({
        path: "applications",
        options: { sort: { createdAt: -1 } },
        populate: { path: "applicant" }
      })
      .lean();

    if (!job) {
      return res.status(404).json({ message: "Job not found.", success: false });
    }

    // 2) Job sections (include title too so education match can run)
    const jobSections = {
      title: job.title || "",
      description: job.description || "",
      requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : (job.requirements || ""),
      experience: (job.experience !== undefined && job.experience !== null) ? job.experience : (job.experienceLevel || "")
    };
console.log("before jobembedding");
    // 3) Embeddings for each job section
    const jobEmbeddings = {};
    // for (const [key, value] of Object.entries(jobSections)) {
    //   jobEmbeddings[key] = value ? await getEmbedding(value) : null;
    // }

    let scoredApplications = [];

    // 4) Iterate applications
    for (const app of job.applications) {
      try {
        const user = app.applicant || app.userId || app.user;
        if (!user || !user?.profile?.resume) {
          scoredApplications.push({ ...app, score: null });
          continue;
        }
console.log("inside for loop");
        console.log("Resume URL/Path:", user.profile.resume);
        // ---- Extract sections from resume ----
       // ---- Extract sections from resume ----
const resumeText = await extractTextFromPdf(user.profile.resume);
const sections = extractSections(resumeText);
const fixed = moveTechLinesToSkills(sections);

// then use fixed.education / fixed.experience / fixed.skills / fixed.projects
const resumeSections = {
  education: fixed.education,
  experience: fixed.experience,
  skills: fixed.skills,
  projects: fixed.projects
};

console.log("uhrhrhrdfcdrhfcrjuredfcjrejfcjmejfcj",resumeSections);


        // console.log(resumeSections);
        // // ---- Custom parsing ----
        const totalExperienceYears = calculateExperienceDuration(resumeSections.experience);
        console.log("ehjsdghcsadc",totalExperienceYears);
        // console.log("hggggggggggggggggggggggggggjjed",totalExperienceYears);

        // // Compare skills
        // const { overlapPercent, matchedSkills } = compareSkills(
        //   jobSections.requirements,
        //   resumeSections.skills
        // );

        // // ---- Section-wise embeddings ----
        // const resumeEmbeddings = {};
        // for (const [key, value] of Object.entries(resumeSections)) {
        //   // resumeEmbeddings[key] = value ? await getEmbedding(value) : null;
        // }

        // // ---- Calculate similarity section-wise ----
        // const sectionScores = {};

        // // Skills similarity (job requirements vs resume skills section)
        // if (jobEmbeddings.requirements && resumeEmbeddings.skills) {
        //   sectionScores.requirementsMatch = cosineSimilarity(jobEmbeddings.requirements, resumeEmbeddings.skills);
        // }

        // // ✅ Experience numeric comparison (uses jobSections.experience as a number)
        // let expScore = 0;
        // if (jobSections.experience && totalExperienceYears) {
        //   const required = Number(jobSections.experience);
        //   const candidate = Number(totalExperienceYears);
        //   if (!isNaN(required) && required > 0) {
        //     if (candidate >= required) {
        //       expScore = 1; // perfect match
        //     } else {
        //       expScore = candidate / required; // proportional
        //     }
        //   } else {
        //     // If job's experience isn't a reliable number, but embeddings exist, we can fallback later
        //     expScore = 0;
        //   }
        // }
        // sectionScores.experienceMatch = expScore;

        // // Embedding similarity for description ↔ projects
        // if (jobEmbeddings.description && resumeEmbeddings.projects) {
        //   sectionScores.projectsMatch = cosineSimilarity(jobEmbeddings.description, resumeEmbeddings.projects);
        // }

        // // Education / title similarity (optional)
        // if (jobEmbeddings.title && resumeEmbeddings.education) {
        //   sectionScores.educationMatch = cosineSimilarity(jobEmbeddings.title, resumeEmbeddings.education);
        // }

        // // ---- Final Score ----
        // const values = Object.values(sectionScores).filter(v => typeof v === "number");
        // const avgSim = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        // const score = Number((avgSim * 100).toFixed(2));

        // // ---- Push result ----
        // scoredApplications.push({
        //   ...app,
        //   score,
        //   details: {
        //     sectionScores,
        //     calculatedExperienceYears: totalExperienceYears,
        //     skillsOverlap: matchedSkills,
        //     skillsOverlapPercent: overlapPercent
        //   }
        // });

      } catch (err) {
        console.error(`Error scoring application ${app._id}:`, err.message || err);
        scoredApplications.push({ ...app, score: null });
      }
    }

    // 5) Replace applications
    console.log("jhf tcrtyvukluytjrerzqwxrctyu",scoredApplications);
    // job.applications = scoredApplications;
    return res.status(200).json({ job, success: true });

  } catch (error) {
    console.error("getApplicants error:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// ---------- Robust section extraction helpers ----------

// Add/extend synonyms as needed
const HEADING_SYNONYMS = {
  education: ["education", "academic", "academics", "qualifications"],
  experience: ["experience", "work experience", "workexperience", "employment history", "professional experience"],
  skills: ["skills", "technical skills", "technicalskills", "skill set", "skillset", "coursework", "coursework skills", "tech stack", "technologies"],
  projects: ["projects", "project", "personal projects", "academic projects"],
  achievements: ["achievements", "awards", "accomplishments"],
  certifications: ["certifications", "certificates", "licenses"],
  summary: ["summary", "objective", "profile", "about me"],
  por: ["position of responsibility", "positionofresponsibility", "leadership", "roles", "responsibility"]
};

const ALL_HEADING_TOKENS = Array.from(new Set(Object.values(HEADING_SYNONYMS).flat().map(t => norm(t))));

function norm(s = "") {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Preprocess raw text to:
 *  - normalize newlines & bullets
 *  - break glued CamelCase (aA -> a A)
 *  - ensure common headings get a newline before them
 *  - separate slashes/pipes with spaces
 */
function preprocessText(text = "") {
  if (!text) return "";

  let t = String(text);

  // normalize newlines & bullets
  t = t.replace(/\r/g, "\n");
  t = t.replace(/[•·▪●◦]/g, "\n");
  t = t.replace(/\t/g, " ");

  // insert space between lower->Upper camel glue: "HimanshuAgrawal" -> "Himanshu Agrawal"
  t = t.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  // separate slashes/pipes: COURSEWORK/SKILLS -> COURSEWORK / SKILLS
  t = t.replace(/([^\s])\s*[\/|]\s*([^\s])/g, "$1 / $2");

  // Ensure newline before common headings if glued: add \n before the heading token
  const headingWords = [
    "EDUCATION","EXPERIENCE","SKILLS","TECHNICAL SKILLS","TECHNICALSKILLS","PROJECTS",
    "PROJECT","ACHIEVEMENTS","CERTIFICATIONS","COURSEWORK","POSITION OF RESPONSIBILITY","SUMMARY","OBJECTIVE","PROFILE"
  ];
  const hwRegex = new RegExp(`\\b(${headingWords.map(h => escapeRegex(h)).join("|")})\\b`, "gi");
  t = t.replace(hwRegex, "\n$1");

  // collapse multiple spaces/newlines
  t = t.replace(/[ ]{2,}/g, " ");
  t = t.replace(/\n{2,}/g, "\n");

  return t.trim();
}

/**
 * Split text into lines, and isolate multiple heading tokens that appear in same line.
 * Also fix lines with only "/" or "|" by merging with neighbors.
 */
function splitAndFixLines(text = "") {
  const pre = preprocessText(text);
  if (!pre) return [];

  let lines = pre.split("\n").map(l => l.trim()).filter(Boolean);

  // If a line contains multiple heading tokens, split them out.
  // Build a regex of heading synonyms (longest first to avoid partial matches)
  const flatSyns = Array.from(new Set(Object.values(HEADING_SYNONYMS).flat()))
    .sort((a,b) => b.length - a.length)
    .map(s => escapeRegex(s));
  const headingRegex = new RegExp(`\\b(${flatSyns.join("|")})\\b`, "gi");

  const newLines = [];
  for (const line of lines) {
    let m;
    headingRegex.lastIndex = 0;
    const matches = [];
    while ((m = headingRegex.exec(line)) !== null) {
      matches.push({ idx: m.index, len: m[0].length });
    }
    if (matches.length === 0) {
      newLines.push(line);
      continue;
    }
    // Split into segments around matches
    let cursor = 0;
    for (const mt of matches) {
      if (mt.idx > cursor) {
        const seg = line.substring(cursor, mt.idx).trim();
        if (seg) newLines.push(seg);
      }
      newLines.push(line.substr(mt.idx, mt.len).trim());
      cursor = mt.idx + mt.len;
    }
    if (cursor < line.length) {
      const tail = line.substring(cursor).trim();
      if (tail) newLines.push(tail);
    }
  }

  lines = newLines;

  // Merge stray "/" or "|" lines: if a line is just "/" and has prev and next, combine prev + "/" + next
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if ((l === "/" || l === "|" || l === "-") && i > 0 && i + 1 < lines.length) {
      const merged = `${lines[i-1].trim()} / ${lines[i+1].trim()}`;
      // replace previous, remove current and next
      lines.splice(i-1, 3, merged);
      i = Math.max(0, i - 2);
    }
  }

  // Also handle lines that end with "/" or start with "/" (merge accordingly)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].endsWith("/") && i + 1 < lines.length) {
      lines[i] = (lines[i] + " " + lines[i+1]).replace(/\/\s+/, "/ ");
      lines.splice(i + 1, 1);
    } else if (lines[i].startsWith("/") && i > 0) {
      lines[i-1] = (lines[i-1] + " " + lines[i]).replace(/\s+\/\s+/, " / ");
      lines.splice(i, 1);
      i--;
    }
  }

  // final trim
  return lines.map(l => l.trim()).filter(Boolean);
}

/**
 * Build heading occurrences: returns array of { index, label } where label is one of keys in HEADING_SYNONYMS
 */
function findHeadingOccurrences(lines = []) {
  const occurrences = [];
  const labels = Object.keys(HEADING_SYNONYMS);
  for (let i = 0; i < lines.length; i++) {
    const lnNorm = norm(lines[i]);
    for (const label of labels) {
      for (const syn of HEADING_SYNONYMS[label]) {
        if (!syn) continue;
        const sNorm = norm(syn);
        if (sNorm && lnNorm.includes(sNorm)) {
          occurrences.push({ index: i, label });
          // once matched, break synonyms for label
          i; // noop
          break;
        }
      }
      if (occurrences.length && occurrences[occurrences.length - 1].index === i) break;
    }
  }
  return occurrences;
}

/**
 * Main extractor: returns all sections in one pass.
 * Result keys: education, experience, skills, projects, achievements, certifications, summary, por
 */
function extractSections(fullText = "") {
  const result = {
    education: "",
    experience: "",
    skills: "",
    projects: "",
    achievements: "",
    certifications: "",
    summary: "",
    por: ""
  };

  if (!fullText || !fullText.trim()) return result;

  const lines = splitAndFixLines(fullText);
  if (!lines.length) return result;

  const occ = findHeadingOccurrences(lines);

  // If no headings found, fallback: attempt to find blocks by scanning for keywords inline
  if (occ.length === 0) {
    // fallback simple regex blocks: split by big keywords positions
    const bigKeywords = ["education", "experience", "skills", "projects", "achievements", "certifications", "summary", "position"];
    const lc = fullText.toLowerCase();
    for (const k of bigKeywords) {
      const idx = lc.indexOf(k);
      if (idx !== -1) {
        // crude slice: from keyword to next keyword
        const nextIdx = bigKeywords.map(kk => lc.indexOf(kk, idx + 1)).filter(x => x > idx).sort((a,b) => a-b)[0] || fullText.length;
        const block = fullText.substring(idx, nextIdx).trim();
        if (k.startsWith("education")) result.education = result.education || block;
        if (k.startsWith("experience")) result.experience = result.experience || block;
        if (k.startsWith("skills")) result.skills = result.skills || block;
        if (k.startsWith("projects")) result.projects = result.projects || block;
      }
    }
    return result;
  }

  // Build mapping from label => first occurrence index
  const labelFirstIndex = {};
  for (const o of occ) {
    if (labelFirstIndex[o.label] === undefined) labelFirstIndex[o.label] = o.index;
  }

  // For each label we want, compute start index (labelFirstIndex[label]) and end index (next smallest index greater than start)
  const labelsToExtract = Object.keys(result);
  const allIndices = Object.values(labelFirstIndex).sort((a,b) => a-b);

  for (const label of labelsToExtract) {
    if (labelFirstIndex[label] === undefined) {
      result[label] = "";
      continue;
    }
    const start = labelFirstIndex[label];
    // find next heading index
    const laterIndices = allIndices.filter(i => i > start);
    const end = laterIndices.length ? laterIndices[0] : lines.length;
    // include heading line and content up to end (exclusive)
    const blockLines = lines.slice(start, end);
    result[label] = blockLines.join("\n").trim();
  }

  // Post-clean: if some sections are empty but content exists in others, try to heuristically reassign
  // Example: sometimes technical skills appended to experience line; move lines containing "languages:" or "technologies" to skills
  if ((!result.skills || result.skills.trim() === "") && result.experience) {
    const experLines = result.experience.split("\n");
    const moveIdxs = [];
    const moveLines = [];
    for (let i = experLines.length - 1; i >= 0; i--) {
      const ln = experLines[i].toLowerCase();
      if (ln.includes("languages:") || ln.includes("technologies") || ln.includes("developer tools") || ln.includes("frameworks") || ln.includes("react") || ln.includes("nodejs") || ln.includes("mongodb")) {
        moveLines.unshift(experLines[i]);
        moveIdxs.push(i);
      } else {
        // stop when we reach a normal-sentence line (heuristic)
        break;
      }
    }
    if (moveLines.length) {
      // remove those lines from experience
      for (const idx of moveIdxs) experLines.splice(idx, 1);
      result.experience = experLines.join("\n").trim();
      result.skills = (moveLines.join("\n") + (result.skills ? ("\n" + result.skills) : "")).trim();
    }
  }

  return result;
}

// Export for usage (if using modules)
// export { extractSections, preprocessText, splitAndFixLines, findHeadingOccurrences, calculateExperienceDuration };

// ---------- calculateExperienceDuration (use your earlier robust one or keep below) ----------
function calculateExperienceDuration(expText) {
  if (!expText || !expText.trim()) return 0;

  const cleaned = expText
    .replace(/[’'"]/g, "")
    .replace(/–|—/g, "-")
    .replace(/\s+to\s+/gi, "-")
    .replace(/[•▪●◦·]/g, "\n")
    .replace(/\r/g, "\n");

  const rangePattern = /([A-Za-z]{3,9}\s*\d{4}|\d{1,2}[\/\-.]\d{4}|\d{4})\s*-\s*(Present|present|current|now|[A-Za-z]{3,9}\s*\d{4}|\d{1,2}[\/\-.]\d{4}|\d{4})/gi;
  const intervals = [];
  let m;
  while ((m = rangePattern.exec(cleaned)) !== null) {
    const left = m[1].trim();
    const right = m[2].trim();
    const startDate = parseDateString(left, false);
    const endDate = /^(present|current|now)$/i.test(right) ? new Date() : parseDateString(right, true);
    if (startDate && endDate && startDate <= endDate) {
      const s = startDate.getFullYear() * 12 + startDate.getMonth();
      const e = endDate.getFullYear() * 12 + endDate.getMonth();
      intervals.push([s, e]);
    }
  }

  if (intervals.length === 0) {
    const durRegex = /(\d+(\.\d+)?)\s*(?:years|yrs|year)/i;
    const found = cleaned.match(durRegex);
    if (found) return Number(parseFloat(found[1]).toFixed(1));
    return 0;
  }

  intervals.sort((a,b) => a[0] - b[0]);
  const merged = [];
  let [cs, ce] = intervals[0];
  for (let i = 1; i < intervals.length; i++) {
    const [s,e] = intervals[i];
    if (s <= ce) ce = Math.max(ce, e);
    else { merged.push([cs, ce]); cs = s; ce = e; }
  }
  merged.push([cs, ce]);

  let totalMonths = 0;
  for (const [s,e] of merged) {
    const months = e - s;
    if (months > 0) totalMonths += months;
  }
  return Number((totalMonths / 12).toFixed(1));
}

function parseDateString(token, isEnd = false) {
  if (!token) return null;
  const t = token.trim();
  let m = t.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const month = Math.min(12, Math.max(1, parseInt(m[1], 10)));
    const year = parseInt(m[2], 10);
    return new Date(year, month - 1);
  }
  m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/i);
  if (m) {
    const mon = m[1].toLowerCase().slice(0,3);
    const monthMap = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const month = monthMap[mon];
    const year = parseInt(m[2], 10);
    if (month === undefined) return null;
    return new Date(year, month);
  }
  m = t.match(/^(\d{4})$/);
  if (m) {
    const year = parseInt(m[1], 10);
    return isEnd ? new Date(year, 11) : new Date(year, 0);
  }
  return null;
}

// Call this after you get sections from extractSections(resumeText)
function moveTechLinesToSkills(sections) {
  if (!sections) return sections;
  const result = { ...sections };

  // Helper normalize
  const norm = (s = "") => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Split into lines helper
  const toLines = (s = "") => String(s || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const joinLines = (arr = []) => Array.from(new Set(arr.map(l => l.trim()).filter(Boolean))).join("\n");

  // 1) If experience contains an explicit TECHNICAL heading, split there
  let expLines = toLines(result.experience || "");
  let skillsLines = toLines(result.skills || "");

  // detect explicit tech-heading index in experience (exact token-like)
  const techHeadingTokens = new Set([
    "technicalskills", "technical", "technologies", "technologies/frameworks", "technologiesframeworks",
    "technologies frameworks", "technologiest", "tech stack", "techstack"
  ]);

  let techIdx = -1;
  for (let i = 0; i < expLines.length; i++) {
    const n = norm(expLines[i]);
    // If the whole line is a tech heading or strongly contains that token, pick it
    for (const t of techHeadingTokens) {
      if (n === t || n.includes(t)) { techIdx = i; break; }
    }
    if (techIdx !== -1) break;
  }

  if (techIdx !== -1) {
    // Move everything after the tech heading into skills
    const moved = expLines.slice(techIdx + 1);
    // Remove the moved lines + heading from experience
    expLines = expLines.slice(0, techIdx);
    // Clean moved lines: remove common heading prefixes like "Technologies / Frameworks:" or "Languages:"
    const cleanedMoved = moved.map(l => l.replace(/^\s*(technologies?(\s*\/\s*frameworks?)?|frameworks?|languages?:|developer tools?:|developer tools|developer:)\s*[:\-\s]*/i, "").trim()).filter(Boolean);
    skillsLines = skillsLines.concat(cleanedMoved);
    result.experience = expLines.join("\n").trim();
    result.skills = joinLines(skillsLines);
    return result;
  }

  // 2) Otherwise, heuristically detect technology lines inside experience
  // Regex to match lines that likely belong to skills/tech:
  const techLineRegex = /\b(languages?:|technolog|framework|react\b|node\b|express\b|mongo(db)?\b|sql\b|no\s*sql\b|javascript\b|js\b|html\b|css\b|bootstrap\b|tailwind\b|vscode\b|github\b|git\b|postman\b|mongoose\b|jwt\b|bcrypt\b|developer tools|technologies\s*\/\s*frameworks)\b/i;

  const remainingExp = [];
  const movedLines = [];

  for (const line of expLines) {
    if (techLineRegex.test(line)) {
      // Clean common prefixes
      const cleaned = line.replace(/^\s*(technologies?(\s*\/\s*frameworks?)?|frameworks?|languages?:|developer tools?:|tools?:)\s*[:\-\s]*/i, "").trim();
      if (cleaned) movedLines.push(cleaned);
    } else {
      // Sometimes a tech-list appears as comma-separated sequence inside a normal sentence.
      // If the line contains many tech tokens, treat it as tech.
      const techTokens = (line.match(/\b(react|node|express|mongodb|mongoose|redux|typescript|javascript|html|css|bootstrap|tailwind|docker|kubernetes|aws|sql|postgres|mysql|git|github|vscode|postman)\b/gi) || []);
      if (techTokens.length >= 3) {
        // likely a tech list
        movedLines.push(line.trim());
      } else {
        remainingExp.push(line);
      }
    }
  }

  if (movedLines.length) {
    // Update experience and skills
    result.experience = remainingExp.join("\n").trim();
    skillsLines = skillsLines.concat(movedLines);
    result.skills = joinLines(skillsLines);
    return result;
  }

  // 3) As a final heuristic: if skills is empty but experience contains "Languages:" line inside, move that
  if ((!result.skills || result.skills.trim().length === 0) && result.experience) {
    const exp = result.experience;
    const lines = toLines(exp);
    const moved2 = [];
    const kept = [];
    for (const line of lines) {
      if (/^\s*languages?:/i.test(line) || /^\s*(technolog|framework)/i.test(line)) {
        const cleaned = line.replace(/^\s*(languages?:|technolog(?:ies)?|frameworks?)\s*[:\-\s]*/i, "").trim();
        if (cleaned) moved2.push(cleaned);
      } else {
        kept.push(line);
      }
    }
    if (moved2.length) {
      result.experience = kept.join("\n").trim();
      result.skills = joinLines(moved2);
    }
  }

  return result;
}

