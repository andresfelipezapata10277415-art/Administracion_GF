const GOOGLE_SHEETS_URL="https://script.google.com/macros/s/AKfycbw4h4lhc5W3c9NEJ1R_kljfha88WjQ1Iwhat1XAjyv-ab8gG9v1RO-DMH1JAgqab2sT/exec";

const serviceSelect=document.getElementById("serviceSelect");
const vehicleFields=document.getElementById("vehicleFields");
const vehicleType=document.getElementById("vehicleType");
const vehiclePlate=document.getElementById("vehiclePlate");
const vehicleBrandModel=document.getElementById("vehicleBrandModel");
const cargoFields=document.getElementById("cargoFields");
const cargoType=document.getElementById("cargoType");
const cargoDimensions=document.getElementById("cargoDimensions");
const cargoWeight=document.getElementById("cargoWeight");
const generalWeightField=document.getElementById("generalWeightField");
const generalWeight=document.getElementById("generalWeight");
const locationFields=document.getElementById("locationFields");
const city=document.querySelector('[name="city"]');
const address=document.querySelector('[name="address"]');
const neighborhood=document.querySelector('[name="neighborhood"]');
const reference=document.querySelector('[name="reference"]');
const dateField=document.getElementById("dateField");
const serviceDate=document.getElementById("serviceDate");
const detailsField=document.getElementById("detailsField");
const details=document.getElementById("details");
const advisoryFields=document.getElementById("advisoryFields");
const advisorySituation=document.getElementById("advisorySituation");
const adminUserName=document.getElementById("adminUserName");
const registeredBy=document.getElementById("registeredBy");
const form=document.getElementById("serviceForm");
const successOverlay=document.getElementById("successOverlay");
const successCloseBtn=document.getElementById("successCloseBtn");
const priceField=document.getElementById("priceField");
const servicePrice=document.getElementById("servicePrice");

document.getElementById("year").textContent=new Date().getFullYear();

const ALLOWED_ADMINS=["William","Yessica","Andrés"];
const nameLoginOverlay=document.getElementById("nameLoginOverlay");
const nameLoginForm=document.getElementById("nameLoginForm");
const adminNameInput=document.getElementById("adminNameInput");
const nameLoginError=document.getElementById("nameLoginError");
const logoutBtn=document.getElementById("logoutBtn");

function normalizeAdminName(value){
  return (value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

function resolveAdminName(value){
  const normalized=normalizeAdminName(value);
  return ALLOWED_ADMINS.find(name=>normalizeAdminName(name)===normalized) || null;
}

function openAdminSession(name){
  adminUserName.textContent=name;
  registeredBy.value=name;
  sessionStorage.setItem("gfAdminUser",name);
  document.body.classList.remove("locked");
  nameLoginOverlay.classList.add("hidden");
  nameLoginOverlay.setAttribute("aria-hidden","true");
}

function closeAdminSession(){
  sessionStorage.removeItem("gfAdminUser");
  adminUserName.textContent="Administrador";
  registeredBy.value="Administrador";
  document.body.classList.add("locked");
  nameLoginOverlay.classList.remove("hidden");
  nameLoginOverlay.setAttribute("aria-hidden","false");
  adminNameInput.value="";
  nameLoginError.textContent="";
  setTimeout(()=>adminNameInput.focus(),50);
}

nameLoginForm?.addEventListener("submit",event=>{
  event.preventDefault();
  const validName=resolveAdminName(adminNameInput.value);

  if(!validName){
    nameLoginError.textContent="Nombre no autorizado. Verifica el nombre e inténtalo de nuevo.";
    adminNameInput.focus();
    adminNameInput.select();
    return;
  }

  nameLoginError.textContent="";
  openAdminSession(validName);
});

logoutBtn?.addEventListener("click",closeAdminSession);

const savedAdmin=resolveAdminName(sessionStorage.getItem("gfAdminUser"));
if(savedAdmin){
  openAdminSession(savedAdmin);
}else{
  closeAdminSession();
}

function updateServiceFields(){
  const service=serviceSelect?.value || "";
  const isCrane=service==="Servicio de grúa";
  const isCargo=service==="Carga y transporte";
  const isAdvisory=service==="Asesoría";

  if(locationFields) locationFields.hidden=isAdvisory;
  [city,address,neighborhood].forEach(field=>{
    if(field){
      field.required=!isAdvisory;
      if(isAdvisory) field.value="";
    }
  });
  if(reference && isAdvisory) reference.value="";

  if(vehicleFields) vehicleFields.hidden=!isCrane;
  [vehicleType,vehiclePlate,vehicleBrandModel].forEach(field=>{
    if(field){
      field.required=isCrane;
      if(!isCrane) field.value="";
    }
  });

  if(cargoFields) cargoFields.hidden=!isCargo;
  [cargoType,cargoWeight].forEach(field=>{
    if(field){
      field.required=isCargo;
      if(!isCargo) field.value="";
    }
  });
  if(cargoDimensions){
    cargoDimensions.required=false;
    if(!isCargo) cargoDimensions.value="";
  }

  if(generalWeightField) generalWeightField.hidden=isCargo || isAdvisory;
  if(generalWeight){
    generalWeight.required=!isCargo && !isAdvisory;
    generalWeight.disabled=isCargo || isAdvisory;
    if(isCargo || isAdvisory) generalWeight.value="";
  }

  if(dateField) dateField.hidden=isAdvisory;
  if(serviceDate){
    serviceDate.required=!isAdvisory;
    if(isAdvisory) serviceDate.value="";
  }

  if(detailsField) detailsField.hidden=isAdvisory;
  if(details && isAdvisory) details.value="";

  if(advisoryFields) advisoryFields.hidden=!isAdvisory;
  if(advisorySituation){
    advisorySituation.required=isAdvisory;
    if(!isAdvisory) advisorySituation.value="";
  }

  // En Asesoría no se solicita precio del servicio.
  if(priceField) priceField.hidden=isAdvisory;
  if(servicePrice){
    servicePrice.required=!isAdvisory;
    if(isAdvisory) servicePrice.value="";
  }
}

serviceSelect?.addEventListener("change",updateServiceFields);
updateServiceFields();


function buildAdminSheetsPayload(formData){
  const service=formData.get("service") || "";

  const payload={
    name:formData.get("name") || "",
    phone:formData.get("phone") || "",
    service:service,
    registeredBy:formData.get("registeredBy") || "",
    precio:formData.get("servicePrice") || "",
    // Alias de compatibilidad para que Apps Script pueda reconocer
    // las notas internas aunque use otro nombre de propiedad.
  };

  if(service==="Servicio de grúa"){
    payload.city=formData.get("city") || "";
    payload.address=formData.get("address") || "";
    payload.neighborhood=formData.get("neighborhood") || "";
    payload.reference=formData.get("reference") || "";
    payload.vehicleType=formData.get("vehicleType") || "";
    payload.vehiclePlate=formData.get("vehiclePlate") || "";
    payload.vehicleBrandModel=formData.get("vehicleBrandModel") || "";
    payload.weight=formData.get("weight") || "";
    payload.date=formData.get("date") || "";
    payload.details=formData.get("details") || "";
  }

  if(service==="Carga y transporte"){
    payload.city=formData.get("city") || "";
    payload.address=formData.get("address") || "";
    payload.neighborhood=formData.get("neighborhood") || "";
    payload.reference=formData.get("reference") || "";
    payload.cargoType=formData.get("cargoType") || "";
    payload.cargoDimensions=formData.get("cargoDimensions") || "";
    payload.cargoWeight=formData.get("cargoWeight") || "";
    payload.date=formData.get("date") || "";
    payload.details=formData.get("details") || "";
  }

  if(service==="Asesoría"){
    payload.advisorySituation=formData.get("advisorySituation") || "";
    payload.precio="";
  }

  return payload;
}

function sendAdminToGoogleSheets(payload){
  return fetch(GOOGLE_SHEETS_URL,{
    method:"POST",
    mode:"no-cors",
    keepalive:true,
    headers:{
      "Content-Type":"text/plain;charset=utf-8"
    },
    body:JSON.stringify(payload)
  });
}

form?.addEventListener("submit",async event=>{
  event.preventDefault();

  if(!form.checkValidity()){
    form.reportValidity();
    return;
  }

  const submitButton=form.querySelector('button[type="submit"]');
  const originalText=submitButton?.innerHTML || "Registrar servicio";

  if(submitButton){
    submitButton.disabled=true;
    submitButton.textContent="Registrando...";
  }

  const formData=new FormData(form);
  const payload=buildAdminSheetsPayload(formData);

  try{
    await sendAdminToGoogleSheets(payload);

    // Mostrar confirmación ANTES de limpiar el formulario.
    if(successOverlay){
      successOverlay.classList.add("open");
      successOverlay.setAttribute("aria-hidden","false");
      document.body.classList.add("modal-open");
    }

    form.reset();
    updateServiceFields();

    // Mantener el usuario administrativo activo.
    const currentAdmin=sessionStorage.getItem("gfAdminUser") || "Administrador";
    registeredBy.value=currentAdmin;

  }catch(error){
    console.error("Error al registrar en Google Sheets:",error);
    alert("No fue posible enviar el registro. Inténtalo nuevamente.");
  }finally{
    if(submitButton){
      submitButton.disabled=false;
      submitButton.innerHTML=originalText;
    }
  }
});



function closeSuccessOverlay(){
  if(!successOverlay) return;
  successOverlay.classList.remove("open");
  successOverlay.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}

successCloseBtn?.addEventListener("click",closeSuccessOverlay);

successOverlay?.addEventListener("click",event=>{
  if(event.target===successOverlay){
    closeSuccessOverlay();
  }
});

document.addEventListener("keydown",event=>{
  if(event.key==="Escape" && successOverlay?.classList.contains("open")){
    closeSuccessOverlay();
  }
});
