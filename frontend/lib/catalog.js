const text = (name, label, nullable = false) => ({ name, label, nullable });
export const severityOptions = ["LOW","MODERATE","HIGH","CRITICAL"].map((value) => ({value,label:value}));
const clinicalFields = [
  {name:"severity",label:"Severity",required:true,options:severityOptions},
  {name:"description",label:"Description",type:"textarea",required:true},
  {...text("descriptionHi","Description (Hindi)",true),type:"textarea"},
  text("risk","Possible risk",true),text("riskHi","Possible risk (Hindi)",true),
  text("recommendation","Recommendation",true),text("recommendationHi","Recommendation (Hindi)",true),
  {...text("sourceUrl","Source URL",true),type:"url"},
];
export const catalogs = {
  medicines: {
    title:"Medicine catalog",path:"/api/medicines",listKey:"medicines",itemKey:"medicine",
    fields:[{...text("name","Name"),required:true},text("genericName","Generic name",true),text("brandName","Brand name",true),text("strength","Strength",true),text("dosageForm","Dosage form",true),text("rxCui","RxCUI",true),text("atcCode","ATC code",true),{name:"aliases",label:"Aliases (comma separated)",type:"tags"}],
  },
  foods:{title:"Food catalog",path:"/api/foods",listKey:"foods",itemKey:"food",fields:[{...text("name","Name"),required:true},text("nameHi","Name (Hindi)",true)]},
  drug:{
    title:"Drug interaction catalog",path:"/api/drug-interactions",listKey:"interactions",itemKey:"interaction",
    fields:[{name:"medicineAId",label:"First medicine",type:"number",source:"medicines",required:true},{name:"medicineBId",label:"Second medicine",type:"number",source:"medicines",required:true},...clinicalFields],
  },
  food:{
    title:"Food interaction catalog",path:"/api/food-interactions",listKey:"interactions",itemKey:"interaction",
    fields:[{name:"medicineId",label:"Medicine",type:"number",source:"medicines",required:true},{name:"foodId",label:"Food",type:"number",source:"foods",required:true},...clinicalFields],
  },
};
