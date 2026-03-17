let inf_biometrucs = document.querySelector("#biometrucs");
let interface_js=document.querySelector("#interface");
let log_managemen_js=document.querySelector("#log_managemen");
inf_biometrucs.addEventListener("click", () => {
  document.querySelector(".box-output").innerHTML = `         
  <div class="box-search">
          <button>back</button>
          <search>search</search>
          <button class="add"><img src="../img/add person icon.jpeg" class="icon"/></button>
        </div>
        <div class="intet-fice">
          <div class="info">
            <h3>phto id</h3>
            <img src="../img/phto id.png" class="phto"/>
          </div>
          <div class="info">
            <label for="informtion-person"><h3>informtion person</h3></label>
            <p>the first name : aml</p>
            <p>the last name : titnik</p>
            <p>nationality : algeria</p>
            <p>residence : algeria</p>
            <p>sex : feminine</p>
            <p>date of birth : 1987/02/1</p>
          </div>
        </div>`;
});
interface_js.addEventListener("click",()=>{
  document.querySelector(".box-output").innerHTML=``;
});
log_managemen_js.addEventListener("click",()=>{
  document.querySelector(".box-output").innerHTML= ``;
});
