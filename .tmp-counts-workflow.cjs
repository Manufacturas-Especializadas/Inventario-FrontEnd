const fs=require('node:fs');
const source=fs.readFileSync('.tmp-units-browser.cjs','utf8');
const helpers=source.slice(0,source.indexOf('async function intercept')).replace('codex-units-','codex-counts-workflow-').replace('if (await evaluate(expression))',"if (await evaluate('Boolean(' + expression + ')'))");
const boot=source.slice(source.indexOf('(async () => {'),source.indexOf('    await until("document.querySelectorAll')).replace(' + "/units"',' + "/inventory-counts"');
eval(helpers+String.raw`
const makeCount=(folio,status,quantities=[null,2])=>({id:Number(folio.slice(3))||1,folio,warehouseId:1,warehouseCode:'ALM-01',warehouseName:'Almacén principal',status,notes:'Zona norte',createdAt:'2026-09-18T09:00:00Z',submittedAt:status!==1?'2026-09-18T10:00:00Z':null,postedAt:status===3?'2026-09-18T11:00:00Z':null,items:quantities.map((q,index)=>({id:index+1,ppeProductId:index+1,sku:'SKU-'+(index+1),productName:index===0?'Guantes anticorte':'Lentes de seguridad',categoryName:index===0?'Manos':'Ojos',countedQuantity:q,systemQuantity:999,variance:status===1?777:index===0?-4:0,countedAt:q===null?null:'2026-09-18T10:00:00Z'}))});
let database=[makeCount('CF-001',1),makeCount('CF-002',2,[1,2]),makeCount('CF-003',3,[1,2]),makeCount('CF-004',4,[1,2])];
let role='Administrator',listDelay=180,reviewDelay=180,failList=false,failReview=false,failWarehouses=false;
const countRequests=(method,suffix)=>requests.filter(r=>r.method===method&&r.pathname.endsWith(suffix)).length;
const getTotal=()=>requests.filter(r=>r.method==='GET').length;
const tab=id=>evaluate("document.getElementById('counts-"+id+"-tab').click()");
const openRow=(folio)=>evaluate("(()=>{const r=[...document.querySelectorAll('#counts-queue tbody tr')].find(r=>r.textContent.includes('"+folio+"'));if(!r)throw Error('Missing row '+"+JSON.stringify(folio)+");r.querySelector('button').click()})()");
const saveProduct=(id)=>evaluate("(()=>{const f=document.getElementById('count-quantity-"+id+"').closest('form');f.requestSubmit();f.requestSubmit()})()");
const saveButton=(id)=>"document.getElementById('count-quantity-"+id+"').closest('form').querySelector('button')";
async function intercept({requestId,request,resourceType}) {
    const url=new URL(request.url),p=url.pathname;
    if(!['XHR','Fetch'].includes(resourceType)&&request.method!=='OPTIONS')return send(url.hostname==='127.0.0.1'?'Fetch.continueRequest':'Fetch.failRequest',{requestId,...(url.hostname==='127.0.0.1'?{}:{errorReason:'BlockedByClient'})});
    let body,status=200;
    if(request.method==='OPTIONS')body={};
    else if(p.endsWith('/auth/me'))body={userId:1,employeeId:1,employeeNumber:'TEST',name:'Prueba',username:'test',roles:[role]};
    else {
        const payload=request.postData?JSON.parse(request.postData):null;
        requests.push({method:request.method,pathname:p,payload});
        const snapshot=structuredClone(database);
        if(p.endsWith('/inventory-counts/drafts')){body=snapshot.filter(c=>c.status===1);const fail=failList;failList=false;await delay(listDelay);if(fail){status=500;body={message:'Fallo drafts simulado'};}}
        else if(p.endsWith('/inventory-counts/pending-review')){body=snapshot.filter(c=>c.status===2);const fail=failReview;failReview=false;await delay(reviewDelay);if(fail){status=500;body={message:'Fallo review simulado'};}}
        else if(p.endsWith('/warehouses')){await delay(150);body=[{id:1,code:'ALM-01',name:'Almacén principal',isActive:true},{id:2,code:'ALM-02',name:'Inactivo',isActive:false}];if(failWarehouses){failWarehouses=false;status=500;body={message:'Fallo almacenes simulado'};}}
        else if(p.endsWith('/inventory-counts')&&request.method==='POST'){await delay(180);body=makeCount('CF-005',1);body.notes=payload.notes;database.push(body);}
        else {
            const parts=p.split('/'),idx=parts.indexOf('inventory-counts'),folio=decodeURIComponent(parts[idx+1]);
            const record=database.find(c=>c.folio===folio);
            if(!record)throw Error('Unexpected folio '+p);
            if(request.method==='GET'){body=snapshot.find(c=>c.folio===folio);await delay(folio==='CF-003'?450:100);}
            else if(request.method==='PUT'&&parts[idx+2]==='items'){
                await delay(180);const item=record.items.find(i=>i.ppeProductId===Number(parts[idx+3]));item.countedQuantity=payload.countedQuantity;item.countedAt='2026-09-18T10:00:00Z';body=item;
            }else if(request.method==='POST'&&parts[idx+2]==='submit'){
                await delay(180);record.status=2;record.submittedAt='2026-09-18T10:00:00Z';record.items.forEach(i=>{i.systemQuantity=2;i.variance=i.countedQuantity-2;});body=record;
            }else if(request.method==='POST'&&parts[idx+2]==='post'){
                await delay(180);record.status=3;record.postedAt='2026-09-18T11:00:00Z';body=record;
            }else throw Error('Unexpected request '+request.method+' '+p);
        }
    }
    return send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,OPTIONS'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
}
`+boot+String.raw`
    await until("document.querySelector('#counts-queue tbody tr')");
    assert.equal(requests.length,1);assert.equal(countRequests('GET','/inventory-counts/drafts'),1);
    assert.equal(countRequests('GET','/warehouses'),0);assert.equal(countRequests('GET','/inventory-counts/pending-review'),0);
    for(const width of [390,768,1366]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));await screenshot('queue-'+width);}
    // Refresh failures retain drafts and dedupe equivalent pending requests.
    failList=true;await evaluate("(()=>{const b=[...document.querySelectorAll('#counts-queue button')].find(b=>b.textContent.trim()==='Actualizar');b.click();b.click()})()");
    assert(await evaluate("!!document.querySelector('#counts-queue tbody tr')"));
    await until("document.body.textContent.includes('Fallo drafts simulado')");assert.equal(countRequests('GET','/inventory-counts/drafts'),2);
    await click('Reintentar');await until("!document.body.textContent.includes('Fallo drafts simulado') && !document.querySelector('#counts-queue [aria-busy=true]')");
    // Warehouses lazy/retry/cache; no global list or product lookups.
    failWarehouses=true;await click('+ Nuevo conteo');await until("document.body.textContent.includes('Fallo almacenes simulado')");
    await click('Reintentar almacenes');await until("!document.getElementById('count-warehouse').matches(':disabled')");
    assert.equal(await evaluate("document.getElementById('count-warehouse').options.length"),2);
    await click('Cancelar');const warehouseRequests=countRequests('GET','/warehouses');await click('+ Nuevo conteo');await delay(50);assert.equal(countRequests('GET','/warehouses'),warehouseRequests);
    await change('count-warehouse','1');const beforeStart=getTotal();
    await evaluate("(()=>{const f=document.querySelector('dialog form');f.requestSubmit();f.requestSubmit()})()");
    await until("document.querySelector('h1')?.textContent==='CF-005'");assert.equal(countRequests('POST','/inventory-counts'),1);assert.equal(getTotal(),beforeStart);assert.equal(await evaluate("!!document.querySelector('dialog')"),false);
    await click('← Volver a conteos');await until("document.querySelectorAll('#counts-queue tbody tr').length===2");
    const beforeDraft=getTotal();await openRow('CF-001');await until("document.getElementById('count-quantity-1')");assert.equal(getTotal(),beforeDraft);
    assert.equal(await evaluate("document.body.textContent.includes('999')||document.body.textContent.includes('777')||!!document.querySelector('[role=tablist]')"),false,'Blind capture and workspace isolation');
    await change('count-product-search','Ojos');await until("document.querySelectorAll('input[type=number]').length===1");await change('count-product-search','');
    await click('Pendientes');await until("document.querySelectorAll('input[type=number]').length===1");await click('Capturados');await until("document.getElementById('count-quantity-2')");
    assert(await evaluate(saveButton(2)+'.disabled'));await saveProduct(2);assert.equal(requests.filter(r=>r.method==='PUT').length,0);
    await change('count-quantity-2','3');await saveProduct(2);await until(saveButton(2)+".textContent==='Guardado'");assert.equal(countRequests('PUT','/CF-001/items/2'),1);
    await click('Todos');await change('count-quantity-1','');await saveProduct(1);await change('count-quantity-1','-1');assert(await evaluate(saveButton(1)+'.disabled'));
    await change('count-quantity-1','0');await saveProduct(1);await until(saveButton(1)+".textContent==='Guardado'");assert.equal(countRequests('PUT','/CF-001/items/1'),1);
    for(const width of [390,768,1366]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'));await screenshot('capture-'+width);}
    assert.equal(getTotal(),beforeDraft);
    // Load review cache; submit while an older draft refresh is pending.
    await click('← Volver a conteos');await tab('review');await until("document.querySelector('#counts-queue tbody tr')");assert.equal(countRequests('GET','/inventory-counts/pending-review'),1);
    assert.equal(await evaluate("document.querySelector('#counts-queue').textContent.includes('Guantes anticorte')"),false,'Review queue is summary only');
    await tab('drafts');await tab('review');await delay(50);assert.equal(countRequests('GET','/inventory-counts/pending-review'),1);
    await tab('drafts');listDelay=650;await click('Actualizar');await delay(30);await openRow('CF-001');
    const beforeSubmit=getTotal();await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Enviar a revisión');b.click();b.click()})()");
    await until("document.body.textContent.includes('enviado a revisión correctamente')");await delay(700);
    assert.equal(countRequests('POST','/CF-001/submit'),1);assert.equal(getTotal(),beforeSubmit);assert.equal(await evaluate("document.querySelectorAll('input[type=number]').length"),0);
    await click('Con diferencias');await until("document.querySelectorAll('tbody tr').length===2");await click('Sin diferencias');await until("document.body.textContent.includes('No hay productos para estos filtros')");await click('Todos');
    await click('← Volver a conteos');assert.equal(await evaluate("document.querySelector('#counts-queue').textContent.includes('CF-001')"),false);
    await tab('review');assert.equal(await evaluate("document.querySelectorAll('#counts-queue tbody tr').length"),2);
    // Publish while old review GET is in flight: no refetch, no resurrection.
    reviewDelay=650;await click('Actualizar');await delay(30);await openRow('CF-001');const beforePost=getTotal();
    await click('Publicar ajuste');assert.equal(countRequests('POST','/CF-001/post'),0);await click('Cancelar');await click('Publicar ajuste');
    await evaluate("(()=>{const b=[...document.querySelectorAll('dialog button')].find(b=>b.textContent.trim()==='Confirmar publicación');b.click();b.click()})()");
    await until("document.body.textContent.includes('publicado correctamente')");await delay(700);
    assert.equal(countRequests('POST','/CF-001/post'),1);assert.equal(getTotal(),beforePost);
    await click('← Volver a conteos');assert.equal(await evaluate("document.querySelector('#counts-queue').textContent.includes('CF-001')"),false);
    failReview=true;await click('Actualizar');await until("document.body.textContent.includes('Fallo review simulado')");assert.equal(await evaluate("document.querySelectorAll('#counts-queue tbody tr').length"),1);
    // All statuses by explicit folio; typing and opening local queues never fetch details.
    for(const [folio,label] of [['CF-005','En captura'],['CF-002','Pendiente de revisión'],['CF-003','Publicado'],['CF-004','Cancelado']]){
        const before=getTotal();await change('count-folio',folio);assert.equal(getTotal(),before);
        await evaluate("(()=>{const f=document.getElementById('count-folio').closest('form');f.requestSubmit();f.requestSubmit()})()");
        await until("document.querySelector('h1')?.textContent==='"+folio+"'");assert.equal(getTotal(),before+1);assert((await evaluate('document.body.textContent')).includes(label));
        if(folio==='CF-003'||folio==='CF-004')assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Publicar ajuste')||b.textContent.includes('Enviar a revisión'))"),false);
        await click('← Volver a conteos');
    }
    await change('count-folio','CF-003');await click('Abrir');await delay(20);await change('count-folio','CF-004');await click('Abriendo...');await until("document.querySelector('h1')?.textContent==='CF-004'");await delay(500);assert.equal(await evaluate("document.querySelector('h1').textContent"),'CF-004');
    // Warehouse role keeps capture permissions but no review tab/publication.
    role='Warehouse';await send('Page.reload');await until("document.querySelector('#counts-queue tbody tr')");assert.equal(await evaluate("!!document.getElementById('counts-review-tab')"),false);
    await change('count-folio','CF-002');await click('Abrir');await until("document.querySelector('h1')?.textContent==='CF-002'");assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>b.textContent==='Publicar ajuste')"),false);
    assert.deepEqual(browserErrors,[]);
    console.log('PASS: lazy catalogs/review, entry matrix, draft capture/dirty/local filters/blindness, start/capture/submit/post no refetch, duplicate writes/GET, local cache transitions, stale GET races, failed refresh retention, explicit folio all statuses and A/B stale, Warehouse permissions, 390/768/1366 layouts.');
`+source.slice(source.indexOf('})().catch(error =>')));
