// ==UserScript==
// @name         Xan
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Intercepts HTTP responses and logs them for parsing
// @author       You
// @match        https://*.twitter.com/*
// @match        file:///E:/cOdInG/xWebElastic/*
// @match        http://localhost:3000/*
// @run-at       document-start
// @resource     REMOTE_CSS https://www.w3schools.com/w3css/4/w3.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1:8050
// ==/UserScript==

(function() {
    //'use strict';

    let globalText = '';
    //w3.css script loading
    const myCss = GM_getResourceText("REMOTE_CSS");
    GM_addStyle(myCss);

    function setAnnotations(data){
        console.log('data: ', data);
        GM_xmlhttpRequest({
            method: "POST",
            data: JSON.stringify(data),
            url: 'http://localhost:8050/setann',
            headers: {
                'Content-Type': "application/json"
            },
            onload: function(response) {
                if([200, 201].includes(response.status)){
                    let result = JSON.parse(response.responseText);
                    console.log('result: ', result);
                }
            },
            onerror: function(err){
                console.log('err on :', data.id, err);
            }
        });
    }

    function setToxicityFromTimeline(data){
        console.log('data: ', data);
        GM_xmlhttpRequest({
            method: "POST",
            data: JSON.stringify(data),
            url: 'http://localhost:8050/settoxicity',
            headers: {
                'Content-Type': "application/json"
            },
            onload: function(response) {
                if([200, 201].includes(response.status)){
                    let result = JSON.parse(response.responseText);
                    console.log('result: ', result);
                }
            },
            onerror: function(err){
                console.log('err on :', data.id, err);
            }
        });
    }

    function setKeywordFromTimeline(data){
        console.log('data: ', data);
        GM_xmlhttpRequest({
            method: "POST",
            data: JSON.stringify(data),
            url: 'http://localhost:8050/setkws',
            headers: {
                'Content-Type': "application/json"
            },
            onload: function(response) {
                if([200, 201].includes(response.status)){
                    let result = JSON.parse(response.responseText);
                    console.log('result: ', result);
                }
            },
            onerror: function(err){
                console.log('err on :', data.id, err);
            }
        });
    }

    function setCriticalForm(critical){

        console.log('crit: ', JSON.stringify(critical));
        //remove all but one
        let tgroup = document.getElementById("criticalForm").querySelectorAll(".textfield-group");
        let needToDel = tgroup.length;
        for(let i=0; i<needToDel-1;i++){
            tgroup[i].remove();
        }

        //create with proper number
        let newNeededFields = critical?.length-1;
        while(newNeededFields > 0){
            document.getElementById("criticalForm").querySelector('#addButton').click();
            newNeededFields--;
        }

        //fill created fields
        /*document.getElementById("criticalForm").querySelectorAll("textarea[name='data[]']").forEach(tarea => {
            let q = critical?.shift()?.q;
            console.log(q);
            tarea.value = q;
        });*/

        //fill created fields
        console.log('critical form length: ', document.getElementById("criticalForm").querySelectorAll(".textfield-group").length);
        document.getElementById("criticalForm").querySelectorAll(".textfield-group").forEach(group => {
            let obj = critical?.shift()
            //let i = critical?.shift()?.q;
            console.log(obj?.a, obj?.q);
            group.querySelector('.rav-ques').value = obj.q;
            group.querySelector('.rav-resps').value = obj?.a ? obj.a : '';
            group.querySelector('#critical-claim').checked = obj.claim;
        });
    }

    function setNotincontextForm(notincontext){

        console.log('crit: ', JSON.stringify(notincontext));
        //remove all but one
        let tgroup = document.getElementById("notincontextForm").querySelectorAll(".textfield-group");
        let needToDel = tgroup.length;
        for(let i=0; i<needToDel-1;i++){
            tgroup[i].remove();
        }

        //create with proper number
        let newNeededFields = notincontext?.length-1;
        while(newNeededFields > 0){
            document.getElementById("notincontextForm").querySelector('#addButton').click();
            newNeededFields--;
        }

        //fill created fields
        console.log('notincontext form length: ', document.getElementById("notincontextForm").querySelectorAll(".textfield-group").length);
        document.getElementById("notincontextForm").querySelectorAll(".textfield-group").forEach(group => {
            let obj = notincontext?.shift()
            //let i = notincontext?.shift()?.q;
            console.log(obj?.a, obj?.q);
            group.querySelector('.rav-ques').value = obj.q;
            group.querySelector('.rav-resps').value = obj?.a ? obj.a : '';
            group.querySelector('#notincontext-claim').checked = obj.claim;
        });
    }

    function setImplicitForm(implicit){

        console.log('implicit: ', implicit);
        //remove all but one
        let tgroup = document.getElementById("implicitForm").querySelectorAll(".textfield-group");
        let needToDel = tgroup.length;
        for(let i=0; i<needToDel-1;i++){
            tgroup[i].remove();
        }

        //create with proper number
        let newNeededFields = implicit?.length-1;
        while(newNeededFields > 0){
            document.getElementById("implicitForm").querySelector('#addButton').click();
            newNeededFields--;
        }

        //fill created fields
        document.getElementById("implicitForm").querySelectorAll(".textfield-group").forEach(group => {
            let obj = implicit?.shift()
            //let i = implicit?.shift()?.q;
            console.log(obj.i, obj?.q);
            group.querySelector('.rav-ques').value = obj?.q ? obj.q : '';
            group.querySelector('.rav-resps').value = obj.i;
            group.querySelector('#implicit-claim').checked = obj.claim;
            if(obj.type === "data"){
                group.querySelector("input[id^='implicitData']").checked = true;
            }
            else if(obj.type === "lang"){
                group.querySelector("input[id^='implicitLang']").checked = true;
            }
        });
    }

    function setToxicityForm(toxicity, badge=false){
        let toxicityForm = document.getElementById("toxicity");
        console.log('toxicityForm: ', toxicityForm);
        toxicityForm.querySelector('#toxic').checked = toxicity.toxic;
        toxicityForm.querySelector('#nsfw').checked = toxicity.nsfw;
        toxicityForm.querySelector('#rtaboo').checked = toxicity.rtaboo;
        toxicityForm.querySelector('#ptaboo').checked = toxicity.ptaboo;
        if(badge){
            if(!document.querySelector("#id01").querySelector("button[forId='toxicity']").querySelector("#toxicityBadge")){
                document.querySelector("#id01").querySelector("button[forId='toxicity']").insertAdjacentHTML('beforeend', "<span class='w3-badge w3-green' id='toxicityBadge'>4</span>");
            }
        }
        else{
            document.querySelector("#id01").querySelector("button[forId='toxicity']").querySelector("#toxicityBadge")?.remove();
        }
    }

    function setKeywordInTimeline(keywords, type){
        document.querySelectorAll('article').forEach(article => {
            if(article.querySelector(`#${type}-list`)?.children?.length == 0){
                let statusId = '';
                let sendButton = document.createElement('div');
                sendButton.style.cssText = "padding-left: 50px";
                sendButton.style.zIndex = 100;
                let sendLink = document.createElement('a');

                article.querySelectorAll("a").forEach(a => {
                    let userId = '';
                    a.querySelectorAll("span").forEach(txt =>{
                        if(txt !== '' && txt.textContent.includes("@")){
                            userId = txt.textContent.replace("@", "");
                        }
                    })
                    let link = a.href;
                    if(link.includes('/status/') && link.includes(userId)){
                        let linkParts = link.split("/");
                        statusId = linkParts[5];
                    }
                });
                let keyList = article.querySelector(`#${type}-list`);
                if(keywords.hasOwnProperty(statusId)){
                    console.log('statusId: ', statusId, type, keywords[statusId]?.keywords);
                    if(type === 'keyword'){
                        keywords[statusId]?.keywords?.forEach(keyword => {
                            //console.log(
                            //article.querySelector("#" + "keyword" + '-input').value = keyword;
                            addKeyword(type, article, statusId, keyword);
                        });
                    }
                    else if(type === 'topic'){
                        keywords[statusId]?.topics?.forEach(topic => {
                            addKeyword(type, article, statusId, topic);
                        });
                    }
                    else if(type === 'tag'){
                        keywords[statusId]?.tags?.forEach(tag => {
                            addKeyword(type, article, statusId, tag);
                        });
                    }
                }
                //addKeyword('keyword', article);
            }
        });
    }

    function setToxicityInTimeline(toxicity){
        document.querySelectorAll('article').forEach(article => {
            let allLangs = [];
            article.querySelectorAll("div[data-testid='tweetText']").forEach(textItem => allLangs.push(textItem.lang))
            //if(!article.getAttribute('ravaz') && allLangs.includes('fa')){
            let statusId = '';
            let sendButton = document.createElement('div');
            sendButton.style.cssText = "padding-left: 50px";
            sendButton.style.zIndex = 1000;
            let sendLink = document.createElement('a');

            article.querySelectorAll("a").forEach(a => {
                let userId = '';
                a.querySelectorAll("span").forEach(txt =>{
                    if(txt !== '' && txt.textContent.includes("@")){
                        userId = txt.textContent.replace("@", "");
                    }
                })
                let link = a.href;
                if(link.includes('/status/') && link.includes(userId)){
                    let linkParts = link.split("/");
                    statusId = linkParts[5];
                }
            })

            /*["toxic", "nsfw", "rtaboo", "ptaboo"].forEach(toxicId => {
                console.log(toxicId);
                console.log(statusId);
                console.log(toxicity[statusId]);
                article.querySelector("#" + "toxic" + "-" + statusId).checked = toxicity[statusId]["toxic"];
            });*/
            console.log('toxicity: ', toxicity);
            article.querySelector("#toxic-" + statusId).checked = toxicity[statusId]?.toxicity?.toxic ? toxicity[statusId]?.toxicity?.toxic : false;
            article.querySelector("#ptaboo-" + statusId).checked = toxicity[statusId]?.toxicity?.ptaboo ? toxicity[statusId]?.toxicity?.ptabo : false;
            article.querySelector("#rtaboo-" + statusId).checked = toxicity[statusId]?.toxicity?.rtaboo ? toxicity[statusId]?.toxicity?.rtaboo : false;
            article.querySelector("#nsfw-" + statusId).checked = toxicity[statusId]?.toxicity?.nsfw ? toxicity[statusId]?.toxicity?.nsfw : false;

            //console.log(statusId, Object.keys(toxicity[statusId])?.length);
            console.log('-----------', statusId, toxicity[statusId]);
            if(toxicity.hasOwnProperty(statusId) && toxicity[statusId].hasOwnProperty('toxicity')){
                if(!!toxicity[statusId].toxicity && Object.keys(toxicity[statusId].toxicity).length !== 0){
                    article.querySelector(`#submitToxic-${statusId}`)?.remove();
                }
            }
            //}
        });
    }

    function getMultiAnns(ids){
        GM_xmlhttpRequest({
            method: "POST",
            url: 'http://localhost:8050/getmann',
            data: JSON.stringify(ids),
            headers: {
                'Content-Type': "application/json"
            },
            onload: function(response) {
                if([200, 201].includes(response.status)){
                    let result = JSON.parse(response.responseText);
                    let docs = result.docs.docs.filter(doc => doc.found && Object.keys(doc._source).length !== 0);
                    console.log('docs: ', docs);
                    var res = docs.reduce(
                        (obj, item) => Object.assign(obj, { [item._id]: {
                            toxicity: item._source?.toxicity,
                            keywords: item._source?.keywords,
                            topics: item._source?.topics,
                            tags: item._source?.tags,
                            ner: item._source?.ner,
                            critical: item._source?.critical,
                            implicit: item._source?.implicit,
                            notincontext: item._source?.notincontext
                        }
                        }), {});
                    console.log('res: ', res);
                    setToxicityInTimeline(res);
                    setKeywordInTimeline(res, 'keyword');
                    setKeywordInTimeline(res, 'topic');
                    setKeywordInTimeline(res, 'tag');
                    setSummaryReports(res);



                    //return res_toxicity
                }
                else{
                    console.log('not 200: ', response.statusText);
                    //showNotif(10060, response.statusText);
                    return {}
                }
            }
        })
    }

    function getAnnotations(id, date, func, iterate){
        let link = 'http://localhost:8050/getann';
        if(id){
            link = link + "?id=" + id;
        }else if(date && func){
            link = link + "?func=" + func + "&date=" + encodeURIComponent(date);
        }else{
            alert('no date field is provided!');
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            headers: {
                'Content-Type': "application/json"
            },
            onload: function(response) {
                if([200, 201].includes(response.status)){
                    let result = JSON.parse(response.responseText);
                    console.log('result: ', result);

                    if(!!result._source?.add_date){
                        document.getElementById("date-field").value = result._source.add_date;
                        document.getElementById("data-field").value = result._id;
                    }

                    if(!!result._source?.critical?.length && result._source?.critical?.length !== 0){
                       setCriticalForm(result._source?.critical);
                    }
                    else{
                        setCriticalForm([{"q": ''}]);
                    }

                    if(!!result._source?.notincontext?.length && result._source?.notincontext?.length !== 0){
                       setNotincontextForm(result._source?.notincontext);
                    }
                    else{
                        setNotincontextForm([{"q": ''}]);
                    }

                    if(!!result._source?.implicit?.length && result._source?.implicit?.length !== 0){
                       setImplicitForm(result._source?.implicit);
                    }
                    else{
                        setImplicitForm([{"i": ''}]);
                    }

                    if(!!result._source?.toxicity){
                        setToxicityForm(result._source.toxicity, false);
                    }
                    else{
                        setToxicityForm({
                            toxic: false,
                            nsfw: false,
                            rtaboo: false,
                            ptaboo: false
                        }, true);
                    }

                    if(result?.full_text){
                        //document.getElementById("full_text").innerText = result.full_text;
                        document.getElementById("id01").querySelectorAll("#full_text").forEach(full_text => {
                            full_text.innerHTML = result.full_text;
                        });
                        //document.getElementById("understanding").querySelector("#full_text").innerHTML = result.full_text;
                        //document.getElementById("ner").querySelector("#full_text").innerHTML = result.full_text;
                        //document.getElementById("full_text").value = result.full_text;
                        globalText = result.full_text;
                        //selectedText.replace(/(?:\r\n|\r|\n)/g, '<br />');
                        console.log('ful_text: ', result?.full_text);
                    }
                    else{
                        //document.getElementById("full_text").innerText = '';
                        //document.getElementById("full_text").innerHTML = '';
                        document.getElementById("id01").querySelectorAll("#full_text").forEach(full_text => {
                            full_text.innerHTML = '';
                        });
                        //document.getElementById("full_text").value = '';
                        globalText = '';
                        console.log('no ful_text in result');
                    }

                    if(result?._source?.ner){
                        setNERForm(result._source.ner);
                    }
                    else{
                        setNERForm([]);
                    }

                }else{//if([404].includes(response.status)){
                    //remove all dynamic fields but one
                    if(!iterate){
                        console.log('404 not found');
                        setCriticalForm([{"q": ''}]);
                        setNotincontextForm([{"q": ''}]);
                        setImplicitForm([{"i": ''}]);
                        setToxicityForm({
                            toxic: false,
                            nsfw: false,
                            rtaboo: false,
                            ptaboo: false
                        },
                                        true);
                        setNERForm([]);
                        //document.getElementById("full_text").innerText = '';
                        document.getElementById("full_text").innerHTML = '';
                        document.getElementById("id01").querySelectorAll("#full_text").forEach(full_text => {
                            full_text.innerHTML = '';
                        });
                        //document.getElementById("full_text").value = '';
                        globalText = '';
                    }
                    else{
                        alert('no more posts!');
                    }
                //}
                //else{
                    console.log('not 200: ', response.statusText);
                    //showNotif(10060, response.statusText);
                }
            },
            onerror: function(err){
                console.log('err on :', id, err);
            }
        });
    }

    function addCriticalForm(){
        var form = document.getElementById('criticalForm');
        var addButton = form.querySelector('#addButton');

        addButton.addEventListener('click', function() {

            var newTextFieldGroup = document.createElement('div');
            newTextFieldGroup.className = 'textfield-group';

            var newTextField0 = document.createElement('textarea');
            newTextField0.placeholder = "پرسش*";
            newTextField0.classList.add("rav-ques");
            newTextField0.setAttribute('cols', 35);
            newTextField0.setAttribute('rows', 2);
            let TAclassesToAdd = ['q-field', 'w3-input', 'w3-border', 'w3-round'];
            newTextField0.classList.add(...TAclassesToAdd);
            //newTextField0.setAttribute('placeholder', '');
            newTextField0.type = 'text';
            newTextField0.name = 'ques[]';

            var newTextField = document.createElement('textarea');
            newTextField.placeholder = "جواب";
            newTextField.classList.add("rav-resps");
            newTextField.setAttribute('cols', 35);
            newTextField.setAttribute('rows', 2);

            newTextField.classList.add(...TAclassesToAdd);
            //newTextField.setAttribute('placeholder', '');
            newTextField.type = 'text';
            newTextField.name = 'resps[]';

            let colTA = document.createElement('div');
            let colTAclassesToAdd = ['w3-col', 's11'];
            colTA.classList.add(...colTAclassesToAdd);

            var removeButton = document.createElement('a');
            removeButton.textContent = '-';
            removeButton.style.zIndex = '0';
            //removeButton.style.width = '20px';
            let classesToAdd = ['w3-button', 'w3-circle', 'w3-ripple', 'w3-grey'];
            removeButton.classList.add(...classesToAdd);

            removeButton.addEventListener('click', function() {
                form.removeChild(newTextFieldGroup);
            });

            let colTA2 = document.createElement('div');
            let colTA2classesToAdd = ['w3-col', 's1'];
            colTA2.classList.add(...colTA2classesToAdd);

            colTA.appendChild(newTextField0);
            colTA.appendChild(newTextField);
            newTextFieldGroup.appendChild(colTA);
            colTA2.appendChild(removeButton);
            newTextFieldGroup.appendChild(colTA2);


            let li = document.createElement('li');
            li.innerHTML = `
            <label style="">
             <input type="checkbox" name="critical-claim" value="critical-claim" id="critical-claim">claim</label>
            `;
            newTextFieldGroup.appendChild(li);


            form.insertBefore(newTextFieldGroup, addButton.parentNode.parentNode);

            //swap the last two textare values
            let allTAs = document.querySelector("#criticalForm").querySelectorAll(".rav-ques");
            let temp = allTAs[allTAs.length-1].value
            allTAs[allTAs.length-1].value = allTAs[allTAs.length-2].value;
            allTAs[allTAs.length-2].value = temp;

            let allTAs2 = document.querySelector("#criticalForm").querySelectorAll(".rav-resps");
            let temp2 = allTAs2[allTAs2.length-1].value
            allTAs2[allTAs2.length-1].value = allTAs2[allTAs2.length-2].value;
            allTAs2[allTAs2.length-2].value = temp2;

            let allClaimTemp = document.querySelector("#criticalForm").querySelectorAll('input[id="critical-claim"]');
            let claimTemp = allClaimTemp[allClaimTemp.length-1].checked;
            allClaimTemp[allClaimTemp.length-1].checked = allClaimTemp[allClaimTemp.length-2].checked
            allClaimTemp[allClaimTemp.length-2].checked = claimTemp;


            document.getElementById("criticalques").scrollTo(0, document.getElementById("criticalques").scrollHeight);
        });
    }

    function addNotincontextForm(){
        var form = document.getElementById('notincontextForm');
        var addButton = form.querySelector('#addButton');

        addButton.addEventListener('click', function() {

            var newTextFieldGroup = document.createElement('div');
            newTextFieldGroup.className = 'textfield-group';

            var newTextField0 = document.createElement('textarea');
            newTextField0.placeholder = "پرسش*";
            newTextField0.classList.add("rav-ques");
            newTextField0.setAttribute('cols', 35);
            newTextField0.setAttribute('rows', 2);
            let TAclassesToAdd = ['q-field', 'w3-input', 'w3-border', 'w3-round'];
            newTextField0.classList.add(...TAclassesToAdd);
            //newTextField0.setAttribute('placeholder', '');
            newTextField0.type = 'text';
            newTextField0.name = 'ques[]';

            var newTextField = document.createElement('textarea');
            newTextField.placeholder = "جواب";
            newTextField.classList.add("rav-resps");
            newTextField.setAttribute('cols', 35);
            newTextField.setAttribute('rows', 2);

            newTextField.classList.add(...TAclassesToAdd);
            //newTextField.setAttribute('placeholder', '');
            newTextField.type = 'text';
            newTextField.name = 'resps[]';

            let colTA = document.createElement('div');
            let colTAclassesToAdd = ['w3-col', 's11'];
            colTA.classList.add(...colTAclassesToAdd);

            var removeButton = document.createElement('a');
            removeButton.textContent = '-';
            removeButton.style.zIndex = '0';
            //removeButton.style.width = '20px';
            let classesToAdd = ['w3-button', 'w3-circle', 'w3-ripple', 'w3-grey'];
            removeButton.classList.add(...classesToAdd);

            removeButton.addEventListener('click', function() {
                form.removeChild(newTextFieldGroup);
            });

            let colTA2 = document.createElement('div');
            let colTA2classesToAdd = ['w3-col', 's1'];
            colTA2.classList.add(...colTA2classesToAdd);

            colTA.appendChild(newTextField0);
            colTA.appendChild(newTextField);
            newTextFieldGroup.appendChild(colTA);
            colTA2.appendChild(removeButton);
            newTextFieldGroup.appendChild(colTA2);


            let li = document.createElement('li');
            li.innerHTML = `
            <label style="">
             <input type="checkbox" name="notincontext-claim" value="notincontext-claim" id="notincontext-claim">claim</label>
            `;
            newTextFieldGroup.appendChild(li);


            form.insertBefore(newTextFieldGroup, addButton.parentNode.parentNode);

            //swap the last two textare values
            let allTAs = document.querySelector("#notincontextForm").querySelectorAll(".rav-ques");
            let temp = allTAs[allTAs.length-1].value
            allTAs[allTAs.length-1].value = allTAs[allTAs.length-2].value;
            allTAs[allTAs.length-2].value = temp;

            let allTAs2 = document.querySelector("#notincontextForm").querySelectorAll(".rav-resps");
            let temp2 = allTAs2[allTAs2.length-1].value
            allTAs2[allTAs2.length-1].value = allTAs2[allTAs2.length-2].value;
            allTAs2[allTAs2.length-2].value = temp2;

            let allClaimTemp = document.querySelector("#notincontextForm").querySelectorAll('input[id="notincontext-claim"]');
            let claimTemp = allClaimTemp[allClaimTemp.length-1].checked;
            allClaimTemp[allClaimTemp.length-1].checked = allClaimTemp[allClaimTemp.length-2].checked
            allClaimTemp[allClaimTemp.length-2].checked = claimTemp;

            document.getElementById("notincontext").scrollTo(0, document.getElementById("notincontext").scrollHeight);
        });
    }

    function addImplicitForm(){
        var form = document.getElementById('implicitForm');
        var addButton = form.querySelector('#addButton');

        addButton.addEventListener('click', function() {

            var newTextFieldGroup = document.createElement('div');
            newTextFieldGroup.className = 'textfield-group';

            var newTextField0 = document.createElement('textarea');
            newTextField0.placeholder = "پرسش";
            newTextField0.classList.add("rav-ques");
            newTextField0.setAttribute('cols', 35);
            newTextField0.setAttribute('rows', 2);
            let TAclassesToAdd = ['q-field', 'w3-input', 'w3-border', 'w3-round'];
            newTextField0.classList.add(...TAclassesToAdd);

            newTextField0.type = 'text';
            newTextField0.name = 'ques[]'

            var newTextField = document.createElement('textarea');
            newTextField.placeholder = "جواب*";
            newTextField.classList.add("rav-resps");
            newTextField.setAttribute('cols', 35);
            newTextField.setAttribute('rows', 2);

            newTextField.classList.add(...TAclassesToAdd);
            //newTextField.setAttribute('placeholder', '');
            newTextField.type = 'text';
            newTextField.name = 'resps[]';

            let colTA = document.createElement('div');
            let colTAclassesToAdd = ['w3-col', 's11'];
            colTA.classList.add(...colTAclassesToAdd);

            var removeButton = document.createElement('a');
            removeButton.textContent = '-';
            removeButton.style.zIndex = '0';
            //removeButton.style.width = '20px';
            let classesToAdd = ['w3-button', 'w3-circle', 'w3-ripple', 'w3-grey'];
            removeButton.classList.add(...classesToAdd);

            removeButton.addEventListener('click', function() {
                form.removeChild(newTextFieldGroup);
            });

            let colTA2 = document.createElement('div');
            let colTA2classesToAdd = ['w3-col', 's1'];
            colTA2.classList.add(...colTA2classesToAdd);

            colTA.appendChild(newTextField0);
            colTA.appendChild(newTextField);
            newTextFieldGroup.appendChild(colTA);
            colTA2.appendChild(removeButton);
            newTextFieldGroup.appendChild(colTA2);


            let li = document.createElement('li');
            li.innerHTML = `
            <label style="">
             <input type="checkbox" name="implicit-claim" value="implicit-claim" id="implicit-claim">claim</label>
            `;
            newTextFieldGroup.appendChild(li);

            let impType = document.createElement('div');
            impType.classList.add("radio-implicit");
            let impleRadioNum = document.querySelector("#implicitForm").querySelectorAll(".textfield-group").length;
            impType.innerHTML = `
              <input type="radio" id="implicitData-${impleRadioNum}"" name="implicitType-${impleRadioNum}" value="data">
              <label for="implicitData-${impleRadioNum}"">Data</label>

              <input type="radio" id="implicitLang-${impleRadioNum}" name="implicitType-${impleRadioNum}" value="lang">
              <label for="implicitLang-${impleRadioNum}">Lang</label>`;
            newTextFieldGroup.appendChild(impType);

            form.insertBefore(newTextFieldGroup, addButton.parentNode.parentNode);

            //swap the last two textare values
            let allTAs = document.querySelector("#implicitForm").querySelectorAll(".rav-ques");
            let temp = allTAs[allTAs.length-1].value
            allTAs[allTAs.length-1].value = allTAs[allTAs.length-2].value;
            allTAs[allTAs.length-2].value = temp;

            let allTAs2 = document.querySelector("#implicitForm").querySelectorAll(".rav-resps");
            let temp2 = allTAs2[allTAs2.length-1].value
            allTAs2[allTAs2.length-1].value = allTAs2[allTAs2.length-2].value;
            allTAs2[allTAs2.length-2].value = temp2;

            let allClaimTemp = document.querySelector("#implicitForm").querySelectorAll('input[id="implicit-claim"]');
            let claimTemp = allClaimTemp[allClaimTemp.length-1].checked;
            allClaimTemp[allClaimTemp.length-1].checked = allClaimTemp[allClaimTemp.length-2].checked
            allClaimTemp[allClaimTemp.length-2].checked = claimTemp;

            let implicitType = [];
            let allGroups= [];
            document.querySelector("#implicitForm").querySelectorAll(".textfield-group").forEach(group => {
                allGroups.push(group);
                let flag = implicitType.length;
                group.querySelectorAll("input[name^='implicitType']").forEach(implType => {
                    if(implType.checked){
                        implicitType.push(implType.value)
                    }
                    console.log(implType.value, implType.checked);
                });
                if(implicitType.length != flag + 1){
                    implicitType.push('none');
                }
            });
            let lastTypeTemp = implicitType[allGroups.length-1];
            let notLastTypeTemp = implicitType[allGroups.length-2];

            if(notLastTypeTemp === "data"){
                allGroups[allGroups.length-1].querySelector("input[id^='implicitData']").checked = true;
            }
            else if(notLastTypeTemp === "lang"){
                allGroups[allGroups.length-1].querySelector("input[id^='implicitLang']").checked = true;
            }
            else{
                allGroups[allGroups.length-1].querySelector("input[id^='implicitData']").checked = false;
                allGroups[allGroups.length-1].querySelector("input[id^='implicitLang']").checked = false;
            }

            if(lastTypeTemp === "data"){
                allGroups[allGroups.length-2].querySelector("input[id^='implicitData']").checked = true;
            }
            else if(lastTypeTemp === "lang"){
                allGroups[allGroups.length-2].querySelector("input[id^='implicitLang']").checked = true;
            }
            else{
                allGroups[allGroups.length-2].querySelector("input[id^='implicitData']").checked = false;
                allGroups[allGroups.length-2].querySelector("input[id^='implicitLang']").checked = false;
            }

            document.getElementById("implicit").scrollTo(0, document.getElementById("implicit").scrollHeight);
        });
    }

    function getSelectionOffsets() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return; // No selection

        let start = 0, end = 0;
        const range = selection.getRangeAt(0).cloneRange();

        if (range.startContainer.nodeType === 3) { // Node.TEXT_NODE
            const startNode = range.startContainer;
            const preCaretRange = range.cloneRange(); // Clone the range
            preCaretRange.selectNodeContents(startNode); // Select all text in node
            preCaretRange.setEnd(range.startContainer, range.startOffset); // Set end point to start of selection
            start = preCaretRange.toString().length;

            preCaretRange.setEnd(range.endContainer, range.endOffset); // Extend end point to end of selection
            end = preCaretRange.toString().length;
        } else {
            console.error('Selection range starts within an element, not directly within text.');
        }

        return {start, end};
    }

    function addUnderstandingForm(){
        document.getElementById("full_text").addEventListener('mouseup', function(e){
            var selection = window.getSelection();
            var tstart = selection.anchorOffset;
            var tend = selection.focusOffset;
            console.log("start: " + tstart);
            console.log("end: " + tend);
            console.log('innerText: ', document.getElementById("full_text").innerText.substring(tstart, tend));
            //console.log('innerText: ', document.getElementById("full_text").value.substring(tstart, tend));
            console.log('-----------------------------------------');
            const selObj = window.getSelection();
            const selRange = selObj.getRangeAt(0);
            console.log(selObj);
            console.log(selRange);
            console.log(selObj.toString());
            console.log('rangeObject: ', selObj.baseNode.textContent.substring(selObj.focusOffset, selObj.anchorOffset));
            console.log('=========');
            console.log('global: ', globalText.substring(selObj.focusOffset, selObj.anchorOffset));
            console.log('innerHTML: ', document.getElementById("full_text").innerHTML.substring(selObj.focusOffset, selObj.anchorOffset));
            //console.log('innerHTML: ', document.getElementById("full_text").value.substring(selObj.focusOffset, selObj.anchorOffset));
            console.log(globalText.replaceAll("\n", "^^^"));
/*
            var selection = getSelectionOffsets();
            console.log("start: ", selection['start']);
            console.log("end: ", selection['end']);
            console.log(document.getElementById("full_text").innerText.substring(selection['start'], selection['end']));
*/
        });
    }

    function sortOffsets(anchore, base){
        if(anchore > base){
            return {
                start: base,
                end: anchore
            }
        }
        return {
            start: anchore,
            end: base
        }
    }

    function selectWholeWords(selection) {
        // Extend the range so that it includes the complete words at both ends, excluding punctuation
        function extendRange(range) {
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            let startOffset = range.startOffset;
            let endOffset = range.endOffset;

            // Regex to match word boundaries including punctuation
            const wordBoundaryRegex = /[\s.,،»«؟;؛:×!?(){}[\]'"`~@#$%^&*\\<>\/-]/;

            // Extend startOffset to the beginning of the word, avoiding punctuation
            const startText = startContainer.textContent;
            if (startOffset > 0 && !wordBoundaryRegex.test(startText[startOffset - 1]) && startOffset < startText.length && !wordBoundaryRegex.test(startText[startOffset])) {
                while (startOffset > 0 && !wordBoundaryRegex.test(startText[startOffset - 1])) {
                    startOffset--;
                }
            }

            // Extend endOffset to the end of the word, avoiding punctuation
            const endText = endContainer.textContent;
            if (endOffset > 0 && !wordBoundaryRegex.test(endText[endOffset - 1]) && endOffset < endText.length && !wordBoundaryRegex.test(endText[endOffset])) {
                while (endOffset < endText.length && !wordBoundaryRegex.test(endText[endOffset])) {
                    endOffset++;
                }
            }

            //decremeant endOffset if it ends with space
            if(selection.toString().endsWith(' ')){
                endOffset--;
            }

            // Update the range to encompass the complete words
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);
        }

        // Extend the current selection's range
        if (!selection.isCollapsed) { // Ensure the selection is not just a cursor
            const range = selection.getRangeAt(0).cloneRange();
            extendRange(range);
            selection.removeAllRanges(); // Clear the existing selection
            selection.addRange(range); // Add the new range with whole words
        }
    }

    function selectWholeWords2(selection) {
        // Extend the range so that it includes the complete words at both ends
        function extendRange(range) {
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            let startOffset = range.startOffset;
            let endOffset = range.endOffset;

            // Check if the start is in the middle of a word
            const startText = startContainer.textContent;
            if (startText[startOffset - 1] && !startText[startOffset - 1].match(/\s/) && startText[startOffset] && !startText[startOffset].match(/\s/)) {
                while (startOffset > 0 && !startText[startOffset - 1].match(/\s/)) {
                    startOffset--;
                }
            }

            // Check if the end is in the middle of a word
            const endText = endContainer.textContent;
            if (endText[endOffset - 1] && !endText[endOffset - 1].match(/\s/) && endText[endOffset] && !endText[endOffset].match(/\s/)) {
                while (endOffset < endText.length && !endText[endOffset].match(/\s/)) {
                    endOffset++;
                }
            }

            // Update the range to encompass the complete words
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);
        }

        // Extend the current selection's range
        if (!selection.isCollapsed) { // Ensure the selection is not just a cursor
            const range = selection.getRangeAt(0).cloneRange();
            extendRange(range);
            selection.removeAllRanges(); // Clear the existing selection
            selection.addRange(range); // Add the new range with whole words
        }
    }


    function setNERForm(ner){
        document.getElementById("ner").querySelector(".keyword-list").innerHTML ='';
        ner.forEach(ne => {
            //document.getElementById("ner").querySelector("#ner-list)
            addKeyword('ner', document.getElementById("ner"), document.querySelector("#data-field").value, ne);
        });
    }

    function addNERForm(){
        document.getElementById("ner").querySelector("#full_text").addEventListener('mouseup', function(e){
            const selObj = window.getSelection();
            if(document.getElementById("ner").querySelector('input[id="word-magnet"]').checked){
                selectWholeWords(selObj);
            }
            const selRange = selObj.getRangeAt(0);
            if(selObj.anchorOffset-selObj.focusOffset === 0){
                console.log('nothing is selected!');
                return
            }
            else
            {
                let offsets = sortOffsets(selObj.focusOffset, selObj.anchorOffset);
                console.log('offsets::::::::::::::::::::::::::::', offsets);
                let nerObject = {
                    value: selObj.toString(),
                    start: offsets['start'],
                    end: offsets['end'],
                    kwtype: document.getElementById("ner").querySelector('input[name="color"]:checked').value
                }
                addKeyword('ner', document.getElementById("ner"), document.querySelector("#data-field").value, nerObject);
                submitKeywords(e, 'ner', document.getElementById("ner"), document.querySelector("#data-field").value, nerObject);
                /* DEBUG */
                //console.log(selObj.anchorOffset, selObj.focusOffset);
                //console.log('selObj.toString(): ', selObj.toString());
                //console.log('selObj.baseNode.textContent.substring(selObj.focusOffset, selObj.anchorOffset): ', selObj.baseNode.textContent.substring(selObj.focusOffset, selObj.anchorOffset));
                //console.log('global: ', globalText.substring(selObj.focusOffset, selObj.anchorOffset));
                //console.log('innerHTML: ', document.getElementById("full_text").innerHTML.substring(selObj.focusOffset, selObj.anchorOffset));
                //console.log(globalText.replaceAll("\n", "^^^"));
            }
        });
        document.getElementById("id01").querySelector("#ner-empty").addEventListener('click', function(e) {
            console.log('ner clicked from modal: empty');
            submitKeywords(e, 'ner', document.getElementById("ner"), document.querySelector("#data-field").value);
        });
    }

    function nerColor(value){
        if(value === 'loc'){
            return '#E74C3C'
        }
        else if(value === 'per'){
            return '#28B463'
        }
        else if(value === 'org'){
            return '#3498DB'
        }
        else if(value === 'dat'){
            return '#F9E79F'
        }
        else if(value === 'eve'){
            return '#AF7AC5'
        }
        else if(value === 'num'){
            return '#E5E7E9'
        }
        else if(value === 'pro'){
            return '#A9CCE3'
        }
        else if(value === 'ident'){
            return '#EBDEF0'
        }
        else if(value === 'misc'){
            return '#F39C12'
        }
    }

    function selectTextWithinNode(node, startOffset, endOffset) {
        if (document.body.createTextRange) {
            // For Internet Explorer
            const range = document.body.createTextRange();
            range.moveToElementText(node);
            range.moveStart('character', startOffset);
            range.moveEnd('character', -node.textContent.length + endOffset);
            range.select();
        } else if (window.getSelection) {
            // For other browsers
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStart(node.firstChild, startOffset);
            range.setEnd(node.firstChild, endOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            console.warn('Could not select text in node: Unsupported browser.');
        }
    }

    function addKeyword(type, element, statusId, keywordInput={}) {
        console.log(keywordInput);
        const keywordsList = element.querySelector("#" + type + '-list');
        if(!keywordInput.hasOwnProperty('value')){
            keywordInput = element.querySelector("#" + type + '-input');
        };
        if (keywordInput.value.trim() !== '') {
            // Create keyword display element
            const divElement = document.createElement('div');
            const keywordSpan = document.createElement('span');
            if(type === 'ner'){
                keywordSpan.style.borderRight = `5px solid ${nerColor(keywordInput.kwtype)}`;
                keywordSpan.style.borderTopRightRadius = `5px`;
                keywordSpan.style.borderBottomRightRadius = `5px`;
            }
            //<input type="hidden" id="custId" name="custId" value="3487">
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            if(keywordInput?.kwtype){
                console.log('HEEEEEEEEEEEEEEEEEEY');
                hiddenField.setAttribute('start', keywordInput.start);
                hiddenField.setAttribute('end', keywordInput.end);
                hiddenField.setAttribute('kwtype', keywordInput.kwtype);
            }
            keywordSpan.textContent = keywordInput.value;
            //keywordSpan.className = 'keyword';
            keywordSpan.classList.add(type, 'unselectable');
            keywordSpan.addEventListener('click', function (e) {
                e.stopPropagation();
               // e.preventDefault();
                if(keywordInput?.end){
                    selectTextWithinNode(element.querySelector("#full_text"), keywordInput.start, keywordInput.end);
                }
            });
            keywordSpan.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                console.log(keywordSpan);
                if(element.querySelector("#" + type + "-input")){
                    console.log(element.querySelector("#" + type + "-input").value, keywordSpan.innerText);
                    element.querySelector("#" + type + "-input").value = keywordSpan.innerText;
                }
                divElement.remove();
                submitKeywords(null, type, element, statusId);
            });

            // Create delete button for the keyword
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            //class="w3-button w3-white w3-border"
            deleteBtn.classList.add("w3-button", "w3-white", "w3-border");
            deleteBtn.onclick = function () {
                divElement.remove();
                submitKeywords(null, type, element, statusId);
            };

            divElement.appendChild(keywordSpan);
            //divElement.appendChild(deleteBtn);
            divElement.appendChild(hiddenField);
            keywordsList.appendChild(divElement);

            // Clear the input field
            keywordInput.value = '';
        }
        if(!keywordInput.hasOwnProperty('value')){
            //submitKeywords({}, type, element, statusId);
        }
    }

    // Function to submit keywords
    function submitKeywords(event, type, element, statusId) {
        event?.preventDefault();
        let kws = [];
        element.querySelectorAll('.' + type)?.forEach(keywordSpan => {
            let obj = {
                value: keywordSpan.innerText
            }
            if(keywordSpan?.nextSibling){
                obj['start'] = keywordSpan?.nextSibling?.getAttribute('start');
                obj['end'] =  keywordSpan?.nextSibling?.getAttribute('end');
                obj['kwtype'] = keywordSpan?.nextSibling?.getAttribute('kwtype');
            }
            if(!obj['start']){
                delete obj['start'];
            }
            if(!obj['end']){
                delete obj['end'];
            }
            if(!obj['kwtype']){
                delete obj['kwtype'];
            }
            kws.push(obj);
            console.log('>>>>>>>>>>>:', obj);//.innerText);
        });
        // Log keywords or send them to the server
        console.log('Submitted ', type, " for ", statusId, ": ", kws);
        //if(type === 'keyword'){
            setKeywordFromTimeline({
                id: statusId,
                kws: kws,
                type: type
            });
        //}
        // e.g., you can make an AJAX request to send keywords to the server
    }

    function creatTagList(element, statusId){
        let common_tags = ["سیاست", "فرهنگ", "ورزش", "بین‌الملل", "اقتصاد", "علم", "تکنولوژی", "پزشکی", "سلامت", "کشاورزی", "تاریخ", "مذهب"];
        const parentDiv = document.createElement('div');
        //const parentParentDiv = document.createElement('div');
        parentDiv.classList.add('predefined-tag-list');
        parentDiv.style.cssText = "display: flex; flex-wrap: wrap;";
        common_tags.forEach(tag => {
            const divElement = document.createElement('div');
            const keywordSpan = document.createElement('span');
            keywordSpan.textContent = tag;
            keywordSpan.classList.add('unselectable');
            keywordSpan.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });
            keywordSpan.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                e.preventDefault();
                console.log(keywordSpan.textContent, ' selected');
                element.querySelector("#tag-input").value = keywordSpan.textContent;
                addKeyword('tag', element, statusId);
                submitKeywords(e, 'tag', element, statusId);
                element.querySelector("#tag-input").value = ''
            });

            divElement.appendChild(keywordSpan);
            parentDiv.appendChild(divElement);
            //parentParentDiv.appendChild(parentDiv);
        });

        return parentDiv
    }

    function setSummaryReports(summeries){
        document.querySelectorAll('article').forEach(article => {
            if(!article?.querySelector('.repSum')){
               let statusId = '';
               article.querySelectorAll("a").forEach(a => {
                   let userId = '';
                   a.querySelectorAll("span").forEach(txt =>{
                       if(txt !== '' && txt.textContent.includes("@")){
                           userId = txt.textContent.replace("@", "");
                       }
                   })
                   let link = a.href;
                   if(link.includes('/status/') && link.includes(userId)){
                       let linkParts = link.split("/");
                       statusId = linkParts[5];
                   }
               });
                postReportSummary(article.querySelector('.tweet-header'), summeries[statusId]);
            }
        });
    }
    function postReportSummary(parent, summery){
        let toxicity = summery?.toxicity ? '&#9745;' : '&#9746;';
        let ner = summery?.ner ? '&#9745;' : '&#9746;';
        let implicit = summery?.implicit ? '&#9745;' : '&#9746;';
        let critical = summery?.critical ? '&#9745;' : '&#9746;';
        let notincontext = summery?.notincontext ? '&#9745;' : '&#9746;';
        let keywords = summery?.keywords ? '&#9745;' : '&#9746;';
        let topics = summery?.topics ? '&#9745;' : '&#9746;';
        let tags = summery?.tags ? '&#9745;' : '&#9746;';
        let table = `
        <table class="repSum" cellspacing="0" cellpadding="0">
         <tr>
          <td><span title="Critical ${critical == '&#9745;' ? summery.critical.length : ''}">${critical}</span></td>
          <td><span title="Not in the Context ${notincontext == '&#9745;' ? summery.notincontext.length : ''}">${notincontext}</span></td>
          <td><span title="Toxicity">${toxicity}</span></td>
          <td><span title="Topics ${topics == '&#9745;' ? summery.topics.length : ''}">${topics}</span></td>
         </tr>
         <tr>
          <td><span title="Implications ${implicit == '&#9745;' ? summery.implicit.length : ''}">${implicit}</span></td>
          <td><span title="Named Entities ${ner == '&#9745;' ? summery.ner.length : ''}">${ner}</span></td>
          <td><span title="Keywords ${keywords == '&#9745;' ? summery.keywords.length : ''}">${keywords}</span></td>
          <td><span title="Tags ${tags == '&#9745;' ? summery.tags.length : ''}">${tags}</span></td>
         </tr>
        </table>
        `;
        let container = document.createElement('div');
        container.style.float = 'left';
        container.innerHTML = table;
        parent.appendChild(container);
    }

    function addKeywordForTimeline(article, statusId, type){
        console.log('YOU CAN BE INVISIBLE');

        let title = '';
        let placeholder = '';
        if(type === 'keyword'){
            title = 'کلمات کلیدی';
            placeholder = 'کلمه کلیدی را وارد کنید';
        }
        else if(type === 'topic'){
            title = 'موضوعات';
            placeholder = 'موضوع را وارد کنید';
        }
        else if(type === 'tag'){
            title = 'برچسب‌ها';
            placeholder = 'برچسب را وارد کنید';
        }
        let displayFieldset = window.innerWidth >= 1200 && window.location.href == 'http://localhost:3000/' ? 'block' : 'none';
        let fieldsetWidth = window.innerWidth >= 1200 && window.location.href == 'http://localhost:3000/' ? '500px' : '110px';
        let keywordForm = `
        <div class="w3-row" style="margin-right: 10px;">
          <fieldset class="${type}-fieldset" style="width: ${fieldsetWidth}">
            <legend>${title}</legend>
            <div class="fieldset-content" style="display: ${displayFieldset};">
            <input type="text" id="${type}-input" placeholder="${placeholder}" style="width: 50%;">
            <button type="button" id="${type}-add" class="w3-button w3-white w3-border">+</button>
            <!--<button id="${type}-submit" class="w3-button w3-white w3-border">ثبت</button>-->
            <button id="${type}-empty" class="w3-button w3-white w3-border">خالی رد کردن</button>
            <div id="${type}-list" class="keyword-list" style="display: flex; flex-wrap: wrap;"></div>
            </div>
          </fieldset>
        </div>
        `;

        //let type = 'keyword';
        //article.querySelectorAll('[role="group"]')[0].parentNode.insertAdjacentHTML('beforeend', keywordForm);
        article.querySelector('.annotation-box').insertAdjacentHTML('beforeend', keywordForm);
        article.querySelector(`.${type}-fieldset`).addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
        });
        let legend = article.querySelector(`.${type}-fieldset`).querySelector('legend');
        console.log(legend);
        legend.addEventListener('click', function(e){
            console.log(legend);
            //article.querySelector(`.${type}-fieldset`).querySelector(".fieldset-content").style.display = article.querySelector(`.${type}-fieldset`).querySelector(".fieldset-content").style.display === 'none' ? 'block' : 'none';
            if(article.querySelector(`.${type}-fieldset`).querySelector(".fieldset-content").style.display === 'none'){
                article.querySelector(`.${type}-fieldset`).querySelector(".fieldset-content").style.display = 'block';
                article.querySelector(`.${type}-fieldset`).style.width = '500px';
            }
            else{
                article.querySelector(`.${type}-fieldset`).querySelector(".fieldset-content").style.display = 'none';
                //article.querySelector(`.${type}-fieldset`).parentNode.style.width = "100px"
                article.querySelector(`.${type}-fieldset`).style.width = "110px"
            }
        });
        article.querySelector("#" + type + '-input').addEventListener('keypress', function (e) {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword(type, article, statusId);
                submitKeywords(e, type, article, statusId);
            }
        });
        article.querySelector("#" + type + "-add").addEventListener('click', function(e){
            e.stopPropagation();
            addKeyword(type, article, statusId);
            submitKeywords(e, type, article, statusId);
        })
        console.log('page loaded');

        article.querySelector("#" + type + "-empty")?.addEventListener('click', function(e){
            console.log(type, ' is empty');
            submitKeywords(e, type, article, statusId);
        });

        /*article.querySelector("#" + type + "-submit").addEventListener('click', function (e) {
            submitKeywords(e, type, article, statusId);
        });*/
        if(type === 'tag'){
            //article.querySelector("#tag-input").insertAdjacentHTML("beforebegin", creatTagList().innerHTML);
            article.querySelector("#tag-input").parentNode.insertBefore(creatTagList(article, statusId), article.querySelector("#tag-input"));
        }
    }

    function addToxicityForTimeline(article, statusId){
        let displayFieldset = window.innerWidth >= 1200 && window.location.href == 'http://localhost:3000/' ? 'block' : 'none';
        let fieldsetWidth = window.innerWidth >= 1200 && window.location.href == 'http://localhost:3000/' ? '500px' : '110px';
        let toxicityHTML = `
        <div class="annotation-box" style="display: flex; flex-wrap: wrap; margin-top: 10px">
   <div class="w3-row toxicity" style="margin-right: 10px;">
   <fieldset class="toxic-fieldset" style="width: ${fieldsetWidth}">
    <legend>سمی بودگی</legend>
     <div class="fieldset-content" style="display: ${displayFieldset};">
     <input type="checkbox" class="hidden" name="toxic" id="toxic-${statusId}">
     <label for="toxic-${statusId}">Toxic</label>
     <input type="checkbox" class="hidden" name="nsfw" id="nsfw-${statusId}">
     <label for="nsfw-${statusId}">NSFW</label>
     <input type="checkbox" class="hidden" name="taboo" id="rtaboo-${statusId}">
     <label for="rtaboo-${statusId}">Religious Taboo</label>
     <input type="checkbox" class="hidden" name="taboo" id="ptaboo-${statusId}">
     <label for="ptaboo-${statusId}">Political Taboo</label>
     <button type="button" id="submitToxic-${statusId}" class="w3-button w3-left w3-white w3-border">ثبت</button>
     </div>
    </fieldset>
    </div>
    </div>
   `;

        if(window.innerWidth >= 1200){
            article.querySelectorAll('[role="group"]')[0].parentNode.parentNode.insertAdjacentHTML('beforeend', toxicityHTML);
            if(window.location.href == 'http://localhost:3000/'){
                article.querySelector(".annotation-box").style.flexDirection = 'column';
            }
        }
        else{
            article.querySelectorAll('[role="group"]')[0].parentNode.insertAdjacentHTML('beforeend', toxicityHTML);
        }
        /*article.querySelector("fieldset").addEventListener('click', function(e){
            //e.preventDefault();
            e.stopPropagation()
        });*/

        //console.log(article);
        article.querySelector(`.toxic-fieldset`).addEventListener('click', function(e){
            //e.preventDefault();
            e.stopPropagation();
        });
        let legend = article.querySelector(`.toxic-fieldset`).querySelector('legend');
        console.log(legend);
        legend.addEventListener('click', function(e){
            console.log(legend);
            if(article.querySelector(`.toxic-fieldset`).querySelector(".fieldset-content").style.display === 'none'){
                article.querySelector(`.toxic-fieldset`).querySelector(".fieldset-content").style.display = 'block';
                //article.querySelector(`.toxic-fieldset`).parentNode.style.width = '500px';
                article.querySelector(`.toxic-fieldset`).style.width = '500px';
            }
            else{
                article.querySelector(`.toxic-fieldset`).querySelector(".fieldset-content").style.display = 'none';
                //article.querySelector(`.toxic-fieldset`).parentNode.style.width = "100px";
                article.querySelector(`.toxic-fieldset`).style.width = "110px";
            }
        });
        ["toxic", "nsfw", "rtaboo", "ptaboo", "submitToxic"].forEach(toxicFormId => {
            article.querySelector("#" + toxicFormId + "-" + statusId).addEventListener('click', function(e){
                e.stopPropagation()
                let toxicity = {};
                ["toxic", "nsfw", "rtaboo", "ptaboo", "submitToxic"].forEach(toxicFormId => {
                    toxicity[toxicFormId] = article.querySelector("#" + toxicFormId + "-" + statusId)?.checked;
                });
                delete toxicity["submitToxic"]
                article.querySelector("#" + "submitToxic" + "-" + statusId)?.remove();
                console.log('toxicity :', toxicity);
                setToxicityFromTimeline({toxicity: toxicity, id: statusId});
            });
        });

    }

    function markPosts(){
        let inReachArticles = document.querySelectorAll('article');
        let ids = [];
        inReachArticles.forEach(elem => {
            let allLangs = [];
            elem.querySelectorAll("div[data-testid='tweetText']").forEach(textItem => allLangs.push(textItem.lang));
            if(allLangs.includes('fa')){
                elem.querySelectorAll("a").forEach(a => {
                    let userId = '';
                    a.querySelectorAll("span").forEach(txt =>{
                        if(txt !== '' && txt.textContent.includes("@")){
                            userId = txt.textContent.replace("@", "");
                        }
                    })
                    let link = a.href;
                    if(link.includes('/status/') && link.includes(userId)){
                        let linkParts = link.split("/");
                        ids.push(linkParts[5]);
                    }
                })
            }
        });
        console.log('in reach ids: ', {ids: ids});
        getMultiAnns({ids: ids});
        inReachArticles.forEach(elem => {
            let allLangs = [];
            elem.querySelectorAll("div[data-testid='tweetText']").forEach(textItem => allLangs.push(textItem.lang));
            let statusId = '';
            if(!elem.getAttribute('ravaz') && (allLangs.includes('fa') || allLangs.includes('und'))){
                let sendButton = document.createElement('div');
                sendButton.classList.add("annbut");
                sendButton.style.cssText = "padding-left: 50px";
                sendButton.style.zIndex = 400;
                let sendLink = document.createElement('a');
                sendLink.classList.add("annotation-button");

                elem.querySelectorAll("a").forEach(a => {
                    let userId = '';
                    a.querySelectorAll("span").forEach(txt =>{
                        if(txt !== '' && txt.textContent.includes("@")){
                            userId = txt.textContent.replace("@", "");
                        }
                        //console.log(userId);
                    })
                    let link = a.href;
                    if(link.includes('/status/') && link.includes(userId)){
                        let linkParts = link.split("/");
                        //console.log(link);
                        //console.log(linkParts[5]);
                        statusId = linkParts[5];
                    }
                    //console.log('--', a.href);
                })

                sendLink.textContent = 'Annotate'
                sendLink.setAttribute('id', "ny-btn");
                sendButton.appendChild(sendLink);
                elem.querySelectorAll('[role="group"]')[0]?.insertBefore(sendButton, elem.querySelectorAll('[role="group"]')[0]?.firstChild);
                addToxicityForTimeline(elem, statusId);
                console.log('YOU CAN GO AWAY!!!!');
                addKeywordForTimeline(elem, statusId, 'keyword');
                addKeywordForTimeline(elem, statusId, 'topic');
                addKeywordForTimeline(elem, statusId, 'tag');
                const newElem = document.createElement("div");
                newElem.innerHTMl = "<span>hi there! What's up?</span>";
                sendButton.addEventListener('click', function(e){
                    e.preventDefault();

                    let modal = document.getElementById('id01');
                    if(window.getComputedStyle(modal).display === 'none'){
                        document.getElementById('data-field').value = statusId;
                        document.getElementById('id01').style.display = 'block';
                        document.getElementById('refresh').click();
                    }
                    else{
                        document.getElementById('data-field').value = '';
                        document.getElementById('id01').style.display = 'none';
                    }

                    //clear x-empty checkboxes
                    document.getElementById("id01").querySelectorAll("input[id$='-empty']").forEach(emptyCheck => {
                        emptyCheck.checked = false;
                    });

                    console.log(statusId);


                }, false);
                elem.setAttribute('ravaz', 1);

                elem.querySelectorAll("div[aria-label='تصویر']").forEach(img => {
                    const but = document.createElement('div');
                    but.innerText = "Ann";
                    but.classList.add("img-ann-but")
                    img.appendChild(but);
                    but.addEventListener('click', function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(but.parentNode.querySelector("img").src);
                        document.getElementById('id01').querySelector("img").src = but.parentNode.querySelector("img").src;
                        document.getElementById('id01').style.display = 'block';
                        document.getElementById("image-tab").click();
                    })
                })
                /*
                elem.querySelectorAll("video").forEach(video => {
                    const but = document.createElement('div');
                    but.innerText = "Ann";
                    but.classList.add("img-ann-but")
                    video.parentNode.appendChild(but);
                    but.addEventListener('click', function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(video.poster);
                        document.getElementById('id01').querySelector("img").src = video.poster;
                        document.getElementById('id01').style.display = 'block';
                        document.getElementById("image-tab").click();
                    })
                })*/
            }
        });
    }

    var styles = `
.customize-button {
   position: fixed;
   top: 10px;
   right: 90px;
   /*margin-bottom: 50px;*/
   padding: 10px;
   border-radius: 5px;
   background-color: #eeeeee;
   cursor: pointer;
}
.customize-button:hover {
   background-color: #ddd!important;
}
.city {display:none}
.scrollable-tab {
  overflow-y:auto;
  /*max-height: 200px;*/
  /*height: 450px;*/
}
.overlay-color {background-color: rgba(0,0,0,0.0);}
.textfield-group{
   display:flex;
   flex-direction: row;
   justify-content: center;
   align-items: center;
   margin-bottom: 2px;
   margin-top: 2px;
   border-bottom: 5px solid #aaa;
   padding-bottom: 2px;
}
.tweet-detail {
   display:flex;
   flex-direction: row-reverse;
   justify-content: right;
   align-items: center;
}
#addButton {
   /*height: 30px;*/
}
.resize-div {
   resize: both;
   overflow: auto;
}
/* checkbox: toxicity*/
.hidden {
  position: absolute;
  visibility: hidden;
  opacity: 0;
}

input[type=checkbox]+label {
  color: #555;
  background-color: #eee;
  border: 1px solid #f44336;
  padding: 8px;
  border-radius: 5px;
}

input[type=checkbox]:checked+label {
  color: #fff;
  background-color: #f44336;
  border: 1px solid #555;
  padding: 8px;
  border-radius: 5px;
}
/*checkbox: toxicity*/

.predefined-tag-list span {
            margin-left: 10px;
            padding: 5px;
            border: 1px solid #eee;
            border-radius: 5px;
            display: inline-block;
            background-color: #f9f9f9;
            color: #555;
        }

        .predefined-tag-list button {
            margin-right: 0px;
        }
.keyword-list span {
            margin-left: 10px;
            padding: 5px;
            border: 1px solid #f3f3f3;
            /*border-radius: 5px;*/
            display: inline-block;
            background-color: #f9f9f9;
            color: #555;

        }

        .keyword-list button {
            margin-right: 0px;
        }
        .unselectable {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
.ner-labels {
  list-style-type: none;
  margin: 15px 0 15px 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
}

.ner-labels li {
  float: left;
  margin: 0 5px 0 0;
  width: 100px;
  height: 30px;
  position: relative;
}

.ner-labels label,
.ner-labels input {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.ner-labels input[type="radio"] {
  opacity: 0.01;
  z-index: 100;
}

.ner-labels input[type="radio"]:checked+label,
.Checked+label {
  background: #eee;
}

.ner-labels label {
  padding: 5px;
  border: 1px solid #CCC;
  cursor: pointer;
  z-index: 90;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}
legend, .annotation-button{
cursor: pointer;
}
.img-ann-but:hover, legend:hover, .annotation-button:hover{
color: #aaa;
/*border: #eee;*/
}
.img-ann-but {
    background-color: #eee;
    border: 1px solid #aaa;
    border-radius: 5px;
    padding: 3px;
    width: 35px;
    cursor: pointer;
}
.report-link {
    position: fixed;
    top: 10px;
    right: 10px;
    /* margin-bottom: 50px; */
    padding: 10px;
    border-radius: 5px;
    background-color: #eeeeee;
    cursor: pointer;
}
.report-link:hover {
   background-color: #ddd!important;
}
.radio-implicit {
  display: flex;
  flex-direction: column;
  width: 80px;
}
.radio-implicit {
  margin: 10px;
}

.radio-implicit input[type="radio"] {
  opacity: 0;
  position: fixed;
  width: 0;
}

.radio-implicit label {
    display: inline-block;
    background-color: #eee;
    padding: 10px 20px;
    font-family: sans-serif, Arial;
    font-size: 16px;
    border: 2px solid #444;
    border-radius: 4px;
}

.radio-implicit label:hover {
  background-color: #fff;
}

.radio-implicit input[type="radio"]:focus + label {
    border: 2px solid #444;
}

.radio-implicit input[type="radio"]:checked + label {
    background-color: #aaa;
    border-color: #555;
    color: #fff;
}
article {
    display: flex;
    flex-wrap: wrap;
    margin: 0 auto;
}
.repSum tr td{
    font-size: 25px;
}
`

    var modalHTML = `
<div id="id01" class="w3-modal overlay-color" style="disaply: none; z-index: 505;">
 <div class="w3-modal-content w3-card-4 w3-animate-zoom resize-div" style="position: relative;">
  <header class="w3-container w3-blue" id="modal-header">
   <span id="headerClose" class="w3-button w3-blue w3-xlarge w3-display-topleft">&times;</span>
   <h2>برچسب‌گذاری</h2>
  </header>

  <div class="w3-bar w3-border-bottom">
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="criticalques">انتقادی</button>
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="implicit">ضمنی</button>
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="notincontext">پرسش خارج از متن</button>
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="toxicity">سمی بودگی</button>
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="understanding">درک مطلب</button>
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="ner">موجودیت‌ها</button>
   <button class="tablink w3-bar-item w3-button tab-link w3-right" forId="image" id="image-tab">تصویر‌ها</button>
  </div>

  <div id="criticalques" class="w3-container city scrollable-tab">
   <h3>پرسش انتقادی</h3>
   <div class="modalBody">
     <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
       <input type="checkbox" name="critical-empty" value="critical-empty" id="critical-empty">خالی رد کردن</label>
     </li>
   <form id="criticalForm" class="dynamicForm">
     <!-- Form fields will go here -->
     <div class="textfield-group">
      <div class="w3-col s11">
       <textarea class="q-field w3-input w3-border w3-round rav-ques" name="ques[]" placeholder="پرسش*" rows="2" cols="35"></textarea>
       <textarea class="q-field w3-input w3-border w3-round rav-resps" name="resps[]" placeholder="جواب" rows="2" cols="35"></textarea>
       <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
        <input type="checkbox" name="critical-claim" value="critical-claim" id="critical-claim">claim</label>
       </li>
      </div>
      <div class="w3-col s1">
       <a class="w3-button w3-circle w3-ripple w3-black" style="z-index:0" id="addButton">+</a>
      </div>
     </div>
    </form>
    </div>
  </div>


  <div id="implicit" class="w3-container city scrollable-tab">
   <h3>ضمنی</h3>
   <div class="modalBody">
     <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
       <input type="checkbox" name="implicit-empty" value="implicit-empty" id="implicit-empty">خالی رد کردن</label>
     </li>
   <form id="implicitForm" class="dynamicForm">
     <!-- Form fields will go here -->
     <div class="textfield-group">
      <div class="w3-col s11">
       <textarea class="q-field w3-input w3-border w3-round rav-ques" name="ques[]" placeholder="پرسش" rows="2" cols="35"></textarea>
       <textarea class="q-field w3-input w3-border w3-round rav-resps" name="resps[]" placeholder="جواب*" rows="2" cols="35"></textarea>
       <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
        <input type="checkbox" name="implicit-claim" value="implicit-claim" id="implicit-claim">claim</label>
       </li>
       <div class="radio-implicit">
        <input type="radio" id="implicitData-0" name="implicitType-0" value="data">
        <label for="implicitData-0">Data</label>

        <input type="radio" id="implicitLang-0" name="implicitType-0" value="lang">
        <label for="implicitLang-0">Lang</label>
       </div>
      </div>
      <div class="w3-col s1">
       <a class="w3-button w3-circle w3-ripple w3-black" style="z-index:0" id="addButton">+</a>
      </div>
     </div>
    </form>
    </div>
  </div>

  <div id="understanding" class="w3-container city scrollable-tab">
   <h3>پرسش درک مطلب"</h3>
   <div class="modalBody">
     <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
       <input type="checkbox" name="understanding-empty" value="understanding-empty" id="understanding-empty">خالی رد کردن</label>
     </li>
     <div class="w3-row">
      <div class="w3-col s11 w3-right">
       <span id="full_text" class="w3-input w3-border"></span>
      </div>
     </div>
     <div class="w3-row">
      <form id="understandingForm" class="dynamicForm">
       <div class="textfield-group">
        <div class="w3-col s11">
         <textarea class="q-field w3-input w3-border w3-round rav-ques" name="ques[]" placeholder="پرسش" rows="2" cols="35"></textarea>
         <textarea class="q-field w3-input w3-border w3-round rav-resps" name="resps[]" placeholder="جواب*" rows="2" cols="35"></textarea>
        </div>
        <div class="w3-col s1">
         <a class="w3-button w3-circle w3-ripple w3-black" style="z-index:0" id="addButton">+</a>
        </div>
       </div>
      </form>
     </div>
   </div>
  </div>


  <div id="toxicity" class="w3-container city scrollable-tab">
   <div class="w3-row w3-right">
     <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
       <input type="checkbox" name="toxicity-empty" value="toxicity-empty" id="toxicity-empty">خالی رد کردن</label>
     </li>
   <fieldset>
    <legend><h3>سمی بودگی</h3></legend>
     <input type="checkbox" class="hidden" name="toxic" id="toxic">
     <label for="toxic">Toxic</label>
     <input type="checkbox" class="hidden" name="nsfw" id="nsfw">
     <label for="nsfw">NSFW</label>
     <input type="checkbox" class="hidden" name="taboo" id="rtaboo">
     <label for="rtaboo">Religious Taboo</label>
     <input type="checkbox" class="hidden" name="taboo" id="ptaboo">
     <label for="ptaboo">Political Taboo</label>
    </fieldset>
   </div>
  </div>

  <div id="notincontext" class="w3-container city scrollable-tab">
   <h3>پرسش خارج از متن</h3>
   <div class="modalBody">
     <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
       <input type="checkbox" name="notincontext-empty" value="notincontext-empty" id="notincontext-empty">خالی رد کردن</label>
     </li>
   <form id="notincontextForm" class="dynamicForm">
     <!-- Form fields will go here -->
     <div class="textfield-group">
      <div class="w3-col s11">
       <textarea class="q-field w3-input w3-border w3-round rav-ques" name="ques[]" placeholder="پرسش*" rows="2" cols="35"></textarea>
       <textarea class="q-field w3-input w3-border w3-round rav-resps" name="resps[]" placeholder="جواب" rows="2" cols="35"></textarea>
       <li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
        <input type="checkbox" name="notincontext-claim" value="notincontext-claim" id="notincontext-claim">claim</label>
       </li>
      </div>
      <div class="w3-col s1">
       <a class="w3-button w3-circle w3-ripple w3-black" style="z-index:0" id="addButton">+</a>
      </div>
     </div>
    </form>
    </div>
  </div>

<div id="ner" class="w3-container city scrollable-tab">
   <h3>موجودیت‌های نامدار</h3>
   <div class="modalBody">
     <div class="w3-row">
      <div class="w3-col s11 w3-right">
        <div style="display: inline-grid;float: left;">
         <li style="list-style-type: none;float: left;"><label style="">
          <input type="checkbox" name="word-magnet" value="word-magnet" id="word-magnet" checked>انتخاب کامل کلمه</label>
         </li>
         <button id="ner-empty" class="w3-button w3-left w3-white w3-border">خالی رد کردن</button>
        </div>
        <!--<li style="list-style-type: none;float: left;margin-top: 5px;"><label style="">
         <input type="checkbox" name="ner-empty" value="ner-empty" id="ner-empty">خالی رد کردن</label>
        </li>-->
       <div class="ner-labels">
        <li>
         <input type="radio" name="color" value="loc" id="loc" checked>
         <label style="border-right: 5px solid ${nerColor('loc')}">مکان</label>
        </li>
        <li>
         <input type="radio" name="color" value="org" id="org">
         <label style="border-right: 5px solid ${nerColor('org')}">سازمان</label>
        </li>
        <li>
         <input type="radio" name="color" value="per" id="per">
         <label style="border-right: 5px solid ${nerColor('per')}">شخص</label>
        </li>
        <li>
         <input type="radio" name="color" value="eve" id="eve">
         <label style="border-right: 5px solid ${nerColor('eve')}">رویداد</label>
        </li>
        <li>
         <input type="radio" name="color" value="dat" id="dat">
         <label style="border-right: 5px solid ${nerColor('dat')}">زمان و تاریخ</label>
        </li>
        <li>
         <input type="radio" name="color" value="num" id="num">
         <label style="border-right: 5px solid ${nerColor('num')}">عدد</label>
        </li>
        <li>
         <input type="radio" name="color" value="pro" id="pro">
         <label style="border-right: 5px solid ${nerColor('pro')}">اسم خاص</label>
        </li>
        <li>
         <input type="radio" name="color" value="ident" id="ident">
         <label style="border-right: 5px solid ${nerColor('ident')}">هویت</label>
        </li>
        <li>
         <input type="radio" name="color" value="misc" id="misc">
         <label style="border-right: 5px solid ${nerColor('misc')}">غیره</label>
        </li>
       </div>
       <span id="full_text" class="w3-input w3-border"></span>
      </div>
     </div>
     <div class="w3-row">
        <div id="ner-list" class="keyword-list" style="display: flex; flex-wrap: wrap;">
        </div>
     </div>
   </div>
  </div>


 <div id="image" class="w3-container city scrollable-tab">
   <h3>تصاویر</h3>
   <div class="modalBody">
     <div class="w3-row">
      <div class="w3-col s11 w3-right">
       <span id="full_text" class="w3-input w3-border"></span>
      </div>
     </div>
     <div class="w3-row">
      <form id="imageForm" class="dynamicForm">
       <div class="textfield-group">
        <div class="w3-col s11">
         <img />
         <textarea class="q-field w3-input w3-border w3-round rav-ques" name="ques[]" placeholder="پرسش" rows="2" cols="35"></textarea>
         <textarea class="q-field w3-input w3-border w3-round rav-resps" name="resps[]" placeholder="جواب*" rows="2" cols="35"></textarea>
        </div>
        <div class="w3-col s1">
         <a class="w3-button w3-circle w3-ripple w3-black" style="z-index:0" id="addButton">+</a>
        </div>
       </div>
      </form>
     </div>
   </div>
  </div>


  <div class="w3-container w3-light-grey w3-padding" style="position: absolute; bottom: 0; right: 0; left: 0;">
  <div class="w3-row w3-right tweet-detail">
  <div class="w3-col m6 w3-center">
     <input type="text" size=25 id="date-field" value="" class="w3-input w3-border-0">
   </div>
   <div class="w3-col m3 w3-center">
    <button type="button" id="prevPost" class="w3-button w3-white w3-border">&lt;</button>
    <button type="button" id="nextPost" class="w3-button w3-white w3-border">&gt;</button>
   </div>
   <div class="w3-col m3 w3-center"><button type="button" id="refresh" class="w3-button w3-white w3-border">o</button></div>
   <div class="w3-col m6 w3-center">
     <input type="text" size=40 id="data-field" name="dataField" class="w3-input w3-border-0">
   </div>
  </div>
   <button type="submit" id="submitBut" class="w3-button w3-left w3-white w3-border">ثبت</button>
  </div>
 </div>
</div>

</div>
    `;

    //modal drag management
    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById("modal-header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById("modal-header").onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function openCity(evt, cityName) {
        var i, x, tablinks;
        x = document.getElementsByClassName("city");
        for (i = 0; i < x.length; i++) {
            x[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < x.length; i++) {
            tablinks[i].classList.remove("w3-light-grey");
        }
        document.getElementById(cityName).style.display = "block";
        evt.currentTarget.classList.add("w3-light-grey");
    }

    //add 'Annotate' button to tweets
    window.addEventListener('load', function() {
        //alert('hi');

        //window.addRavaziSahre2 = addRavaziSahre;
        let gButton = "Tomize"
        let topLeft = document.createElement('div');
        let container = document.createElement('div');
        let reportLink = `<a href="http://localhost:8050/report" target="_blank" class="report-link">Report</a>`;

        var styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        topLeft.innerHTML = gButton;
        topLeft.className += " customize-button";
        container.appendChild(topLeft);
        container.insertAdjacentHTML('beforeend', reportLink);

        topLeft.addEventListener('click', function(e){
            //Tomize buttom
            markPosts();
        });
        document.body.appendChild(container);

        //modal loading
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById("headerClose").addEventListener('click', function(){
            document.getElementById('id01').style.display = 'none';
        });

        //criticalForm init
        addCriticalForm();  //claim or not

        //implicit init
        addImplicitForm(); //claim or not   //data or lang

        //understanding init
        addUnderstandingForm();

        //NER init
        addNERForm();

        //notincontext init
        addNotincontextForm();  //claim or not


        //existing annotaions loading from db
        document.getElementById("refresh").addEventListener('click', function(e) {
            let id = document.getElementById("data-field").value;
            console.log('getting: ', id);
            getAnnotations(id, null, null, false);
        });
        document.getElementById("nextPost").addEventListener('click', function(e) {
            let date = document.getElementById("date-field").value;
            console.log('getting: ', date);
            console.log('getting: ', 'gt');
            getAnnotations(null, date, 'gt', true);
        });
        document.getElementById("prevPost").addEventListener('click', function(e) {
            let date = document.getElementById("date-field").value;
            console.log('getting: ', date);
            console.log('getting: ', 'lt');
            getAnnotations(null, date, 'lt', true);
        });
        //gather and send data to db
        document.getElementById("submitBut").addEventListener('click', function(event) {
            event.preventDefault();

            if(document.getElementById("date-field").value == ""){
                document.getElementById("date-field").value = new Date();
            }
            // Process form data here
            //criticalForm
            let criticalF = document.getElementById('criticalForm');
            var cFormData = new FormData(criticalF);
            let criticalQues = cFormData.getAll('ques[]');
            let criticalResps = cFormData.getAll('resps[]');
            let criticalClaims = document.querySelector("#criticalForm").querySelectorAll('input[id="critical-claim"]');
            console.log('criticalQues: ', criticalQues);
            console.log("criticalResps: ", criticalResps);
            console.log("criticalClaims: ", criticalClaims);
            let criticalData = [];
            for(let i=0; i< criticalQues.length; i++){
                criticalData.push({
                    q: criticalQues[i],
                    a: criticalResps[i],
                    claim: criticalClaims[i].checked
                });
            }
            let criticalEmpty = document.getElementById("id01").querySelector('input[id="critical-empty"]').checked;
            console.log('criticalEmpty: ', criticalEmpty);
            console.log('criticalData: ', criticalData);

            //notincontextForm
            let notincontextF = document.getElementById('notincontextForm');
            var nFormData = new FormData(notincontextF);
            let notincontextQues = nFormData.getAll('ques[]');
            let notincontextResps = nFormData.getAll('resps[]');
            let notincontextClaims = document.querySelector("#notincontextForm").querySelectorAll('input[id="notincontext-claim"]');
            console.log('notincontextQues: ', notincontextQues);
            console.log("notincontextResps: ", notincontextResps);
            console.log("notincontextClaims: ", notincontextClaims);
            let notincontextData = [];
            for(let i=0; i< notincontextQues.length; i++){
                notincontextData.push({
                    q: notincontextQues[i],
                    a: notincontextResps[i],
                    claim: notincontextClaims[i].checked
                });
            }
            let notincontextEmpty = document.getElementById("id01").querySelector('input[id="notincontext-empty"]').checked;
            console.log('notincontextEmpty: ', notincontextEmpty);
            console.log('notincontextData: ', notincontextData);

            //implicitForm
            let implicitF = document.getElementById('implicitForm');
            var iFormData = new FormData(implicitF);
            let implicitQues = iFormData.getAll('ques[]');
            let implicitResps = iFormData.getAll('resps[]');
            let implicitClaims = document.querySelector("#implicitForm").querySelectorAll('input[id="implicit-claim"]');
            let implicitType = [];
            document.querySelector("#implicitForm").querySelectorAll(".textfield-group").forEach(group => {
                let flag = implicitType.length;
                group.querySelectorAll("input[name^='implicitType']").forEach(implType => {
                    if(implType.checked){
                        implicitType.push(implType.value)
                    }
                    console.log(implType.value, implType.checked);
                });
                if(implicitType.length != flag + 1){
                    implicitType.push('none');
                }
            });
            console.log('implicitQues: ', implicitQues);
            console.log('implicitResps: ', implicitResps);
            console.log('implicitClaims: ', implicitClaims);
            console.log('implicitType: ', implicitType);
            let implicitData = [];
            for(let i=0; i< implicitResps.length; i++){
                implicitData.push({
                    i: implicitResps[i],
                    q: implicitQues[i],
                    claim: implicitClaims[i].checked,
                    type: implicitType[i]
                });
            }
            let implicitEmpty = document.getElementById("id01").querySelector('input[id="implicit-empty"]').checked;
            console.log('implicitEmpty: ', implicitEmpty);
            console.log('implicitData: ', implicitData);

            let toxicity = {};
            ["toxic", "nsfw", "rtaboo", "ptaboo"].forEach(toxicFormId => {
                toxicity[toxicFormId] = document.querySelector('#toxicity').querySelector("#" + toxicFormId)?.checked;
            });
            console.log("toxicity: ", toxicity);

            let id = document.getElementById("data-field").value;
            setAnnotations({
                id: id,
                critical: criticalData,
                implicit: implicitData,
                toxicity: toxicity,
                notincontext: notincontextData,
                implicitEmpty: implicitEmpty,
                notincontextEmpty: notincontextEmpty,
                criticalEmpty: criticalEmpty
            });
            console.log("criticalData: ", criticalData);
            console.log("notincontextData: ", notincontextData);
        });

        dragElement(document.getElementById("id01"));
        window.onclick = function(event) {
            var modal = document.getElementById("id01");
            if (event.target === modal) {
                document.getElementById('id01').style.display = 'none';
            }
        }

        //tab management
        document.querySelectorAll(".tab-link").forEach(tabButton => {
            tabButton.addEventListener('click', function(e){
                let city = tabButton.getAttribute("forId");
                openCity(e, city);
            });
        });

        document.getElementsByClassName("tablink")[0].click();
    }, false);
})();