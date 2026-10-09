import { test, expect } from "@playwright/test";

test("installed browser English voice starts and stops through the result control", async ({page}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("medisafe_token","native.voice.token");
    window.nativeVoiceState={started:false,language:null,error:null};
    const speech=window.speechSynthesis;
    if(speech){
      speech.getVoices();
      const speak=speech.speak.bind(speech);
      speech.speak=(utterance)=>{
        utterance.addEventListener("start",()=>{window.nativeVoiceState.started=true;window.nativeVoiceState.language=utterance.lang;});
        utterance.addEventListener("error",event=>{window.nativeVoiceState.error=event.error;});
        return speak(utterance);
      };
    }
  });
  await page.route("**/api/medicines",route=>route.fulfill({json:{medicines:[{id:1,name:"Aspirin"},{id:2,name:"Ibuprofen"}]}}));
  await page.route("**/api/drug-interactions/check",route=>route.fulfill({json:{found:false,interaction:null}}));
  await page.goto("/interactions/drug-drug");
  await page.getByRole("combobox",{name:"Medicine",exact:true}).selectOption("1");
  await page.getByRole("combobox",{name:"Second medicine",exact:true}).selectOption("2");
  await page.getByRole("button",{name:"Check interaction",exact:true}).click();
  const english=await page.evaluate(()=>window.speechSynthesis?.getVoices().some(voice=>voice.lang.startsWith("en")) || false);
  await page.getByRole("button",{name:"Listen",exact:true}).click();
  if(english){
    await expect.poll(()=>page.evaluate(()=>window.nativeVoiceState.started),{timeout:10000}).toBe(true);
    expect((await page.evaluate(()=>window.nativeVoiceState)).language).toMatch(/^en/);
    await page.getByRole("button",{name:"Stop audio",exact:true}).click();
    await expect(page.getByRole("button",{name:"Listen",exact:true})).toBeVisible();
  } else {
    await expect(page.getByRole("status")).toContainText("Voice is unavailable");
    test.info().annotations.push({type:"environment",description:"No native English voice was installed; verified text fallback."});
  }
});
