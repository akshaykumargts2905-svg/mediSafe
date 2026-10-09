import { test, expect } from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("medisafe_token","voice.test.token");
    window.voiceCalls=[];
    window.voiceCancels=0;
    window.voiceMode="available";
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class {constructor(text){this.text=text;}}});
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
      getVoices:()=>window.voiceMode==="missing"?[]:[{name:"English test voice",lang:"en-IN"},{name:"Hindi test voice",lang:"hi-IN"}],
      cancel:()=>{window.voiceCancels++;},
      speak:utterance=>{
        window.voiceCalls.push({lang:utterance.lang,text:utterance.text});
        if(window.voiceMode==="error") setTimeout(()=>utterance.onerror?.({error:"audio-busy"}),0);
        else setTimeout(()=>utterance.onstart?.(),0);
      },
    }});
  });
  await page.route("**/api/medicines",route=>route.fulfill({json:{medicines:[{id:1,name:"Aspirin"},{id:2,name:"Ibuprofen"}]}}));
  await page.route("**/api/users/me",route=>route.fulfill({json:{user:{id:1}}}));
  await page.route("**/api/drug-interactions/check",route=>route.fulfill({json:{found:true,interaction:{
    id:1,medicineA:{name:"Aspirin"},medicineB:{name:"Ibuprofen"},severity:"HIGH",
    description:"Review this combination.",descriptionHi:"इस संयोजन की समीक्षा करें।",
    risk:"An unwanted effect.",riskHi:"दुष्प्रभाव हो सकता है।",recommendation:"Ask your doctor.",recommendationHi:"अपने डॉक्टर से पूछें।",
  }}}));
  await page.goto("/interactions/drug-drug");
  await page.getByRole("combobox",{name:"Medicine",exact:true}).selectOption("1");
  await page.getByRole("combobox",{name:"Second medicine",exact:true}).selectOption("2");
  await page.getByRole("button",{name:"Check interaction",exact:true}).click();
});

test("voice uses selected English/Hindi text and can be stopped",async({page})=>{
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  await expect(page.getByRole("button",{name:"Stop audio",exact:true})).toBeVisible();
  let calls=await page.evaluate(()=>window.voiceCalls);
  expect(calls[0].lang).toBe("en-IN");expect(calls[0].text).toContain("Review this combination.");
  await page.getByRole("button",{name:"Stop audio",exact:true}).click();
  await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeVisible();
  await page.getByRole("combobox",{name:"Language / भाषा"}).selectOption("hi");
  await page.getByRole("button",{name:"सुनें",exact:true}).click();
  calls=await page.evaluate(()=>window.voiceCalls);
  expect(calls[1].lang).toBe("hi-IN");expect(calls[1].text).toContain("इस संयोजन की समीक्षा करें।");expect(calls[1].text).toContain("Aspirin");
  const cancels=await page.evaluate(()=>window.voiceCancels);
  await page.getByRole("combobox",{name:"Language / भाषा"}).selectOption("en");
  await expect.poll(()=>page.evaluate(()=>window.voiceCancels)).toBeGreaterThan(cancels);
});

test("missing voice and playback errors retain readable result",async({page})=>{
  await page.evaluate(()=>{window.voiceMode="missing";});
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Voice is unavailable");
  await page.evaluate(()=>{window.voiceMode="error";});
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Audio could not be played");
  await expect(page.locator(".clinical-result")).toContainText("Review this combination.");
});
