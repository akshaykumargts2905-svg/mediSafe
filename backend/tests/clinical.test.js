const { test } = require("node:test");
const assert = require("node:assert/strict");
const { detectMedicines } = require("../lib/normalizeMedicines");
const { localize } = require("../lib/localization");
const { readFields } = require("../lib/validation");
const { translateText } = require("../lib/translation");
const prisma = require("../lib/prisma");

const catalog = [
  {id:1,name:"Paracetamol (Acetaminophen)",genericName:"Acetaminophen",rxCui:"161",aliases:["Paracetamol"]},
  {id:2,name:"Aspirin",genericName:"Aspirin",rxCui:"1191",aliases:[]},
];
test("normalization uses catalog IDs, detects strength, deduplicates and keeps uncertain matches for review", () => {
  const result=detectMedicines("PARACETAMOL 500 mg\nAcetaminophen\nAsplrin 100 mg\nUnknown product",catalog,.55);
  assert.equal(result.matches.length,2);
  assert.equal(result.matches[0].medicineId,1);
  assert.equal(result.matches[0].rxCui,"161");
  assert.equal(result.matches[0].detectedStrength,"500 mg");
  assert.equal(result.matches[1].matchType,"POSSIBLE");
  assert.equal(result.matches[1].confidence,.55);
  assert.deepEqual(result.unmatchedLines,["Unknown product"]);
  assert.equal(detectMedicines("notaspirin",catalog).matches.length,0);
});
test("Hindi display preserves canonical medicine names and reports unavailable translations", () => {
  const original={medicine:{name:"Aspirin",rxCui:"1191"},description:"English",descriptionHi:"हिंदी",risk:"English only"};
  const result=localize(original,"hi");
  assert.equal(result.description,"English");
  assert.equal(result.display.description,"हिंदी");
  assert.deepEqual(result.medicine,original.medicine);
  assert.deepEqual(result.display.untranslated,["risk"]);
  assert.equal(localize({overallStatus:"HIGH_RISK",totalMedicines:2,totalAlerts:1,summary:"English"},"hi").display.summary.startsWith("2 जुड़ी"),true);
});
test("severity, language, URLs and aliases validate before persistence", () => {
  assert.deepEqual(readFields({severity:"critical",aliases:["Aspirin","Aspirin"]},{severity:"severity",aliases:"strings"}),{severity:"CRITICAL",aliases:["Aspirin"]});
  for(const [body,rules] of [[{severity:"SAFE"},{severity:"severity"}],[{language:"xx"},{language:"language"}],[{sourceUrl:"javascript:alert(1)"},{sourceUrl:"url"}],[{aliases:[123]},{aliases:"strings"}]]) assert.throws(()=>readFields(body,rules),{status:400});
});
test("translation provider contract preserves identifiers and rejects changed or missing markers", async () => {
  const originals={drug:prisma.drugDrugInteraction.findFirst,food:prisma.drugFoodInteraction.findFirst,medicines:prisma.medicine.findMany,fetch:global.fetch,url:process.env.TRANSLATION_URL};
  let corrupt=false;
  try {
    prisma.drugDrugInteraction.findFirst=async()=>null;
    prisma.drugFoodInteraction.findFirst=async()=>null;
    prisma.medicine.findMany=async()=>catalog;
    process.env.TRANSLATION_URL="http://translation.test/translate";
    global.fetch=async(url,options)=>{
      assert.equal(url.href,"http://translation.test/translate");
      const body=JSON.parse(options.body);assert.equal(body.source,"en");assert.equal(body.target,"hi");
      assert.ok(!body.q.includes("Aspirin"));assert.ok(!body.q.includes("1191"));
      const markers=body.q.match(/__MEDISAFE_TERM_\d+__/g);
      return {ok:true,json:async()=>({translatedText:corrupt?"identifier lost":markers.join(" ")+" के बारे में पूछें।"})};
    };
    const result=await translateText("Ask about Aspirin, RxCUI 1191.","en","hi");
    assert.match(result.translatedText,/Aspirin/);assert.match(result.translatedText,/1191/);assert.match(result.translatedText,/[\u0900-\u097F]/);
    assert.equal(result.machineTranslated,true);
    corrupt=true;await assert.rejects(translateText("Aspirin 1191","en","hi"),{status:503});
    delete process.env.TRANSLATION_URL;await assert.rejects(translateText("Unknown message","en","hi"),{status:503});
  } finally {
    prisma.drugDrugInteraction.findFirst=originals.drug;prisma.drugFoodInteraction.findFirst=originals.food;prisma.medicine.findMany=originals.medicines;global.fetch=originals.fetch;
    if(originals.url===undefined)delete process.env.TRANSLATION_URL;else process.env.TRANSLATION_URL=originals.url;
    await prisma.$disconnect();
  }
});
