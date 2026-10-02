/* ==========================================================
   Reads uploaded files in the browser.
   PDF  -> pdf.js    DOCX -> mammoth    TXT/MD -> plain text
   Images are sent to the AI as pictures instead of text.
   ========================================================== */

const MAX_CHARS = 60000;           // most text we send for one quiz
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function readPdf(file) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdf.worker.min.js";
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = "";
  for (let n = 1; n <= pdf.numPages && out.length < MAX_CHARS; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    out += content.items.map((i) => i.str + (i.hasEOL ? "\n" : " ")).join("") + "\n\n";
  }
  return out;
}

async function readDocx(file) {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_BYTES) return reject(new Error("That image is over 5 MB. Try a smaller one."));
    const reader = new FileReader();
    reader.onload = () => resolve({ image: reader.result.split(",")[1], mediaType: file.type });
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.readAsDataURL(file);
  });
}

// Returns the text of a PDF, DOCX, TXT or MD file
async function extractText(file) {
  const name = file.name.toLowerCase();
  let text;
  try {
    if (name.endsWith(".pdf")) text = await readPdf(file);
    else if (name.endsWith(".docx")) text = await readDocx(file);
    else if (name.endsWith(".doc")) throw new Error("Old .doc files can't be read. Save it as .docx and try again.");
    else if (name.endsWith(".txt") || name.endsWith(".md")) text = await file.text();
    else throw new Error("That file type isn't supported. Use PDF, DOCX, TXT or MD.");
  } catch (err) {
    if (err.message.startsWith("Old") || err.message.startsWith("That")) throw err;
    throw new Error("Couldn't open that file. It may be damaged or password protected.");
  }
  text = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 50) throw new Error("No readable text found. If this is a scan, upload it as an image instead.");
  return text;
}

// What the quiz maker needs: { text } or { image, mediaType }
async function extractSource(file) {
  if (file.type.startsWith("image/")) return readImage(file);
  return { text: (await extractText(file)).slice(0, MAX_CHARS) };
}
