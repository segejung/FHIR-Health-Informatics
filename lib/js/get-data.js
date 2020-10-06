//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}




//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
      typeof ob.valueQuantity != 'undefined' &&
      typeof ob.valueQuantity.value != 'undefined' &&
      typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    //height: {value: ''},
    weight: {value: ''},
    bmi: {value: ''},
    sys: {value: ''},
    dia: {value: ''},
    ldl: {value: ''},
    hdl: {value: ''},
    age: {value: ''},
    note: 'No Annotation',

  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

function displayChoAnalysis(cho) {
    cholesterol.innerHTML = cho;
}

function displayBmiAnalysis(body) {
    bmi_analysis.innerHTML = body;
}

function displayBloodAnalysis(blood) {
    bp_analysis.innerHTML = blood;
}


//function to display the observation values you will need to update this
function displayObservation(obs) {
  hdl.innerHTML = obs.hdl;
  ldl.innerHTML = obs.ldl;
  sys.innerHTML = obs.sys;
  dia.innerHTML = obs.dia;
  height.innerHTML = obs.height;
  weight.innerHTML = obs.weight;
 // document.getElementById('bmi').innerHTML = obs.bmi;
  //bmi.innerHTML = obs.bmi;
   // console.log(bmi);
}




//once fhir client is authorized then the following functions can be executed
FHIR.oauth2.ready().then(function(client) {

    // get patient object and then display its demographics info in the banner
    client.request(`Patient/${client.patient.id}`).then(
        function (patient) {
            displayPatient(patient);
            console.log(patient);
        }
        );


    const getPath = client.getPath;


    // get observation resoruce values
    // you will need to update the below to retrive the weight and height values
    var query = new URLSearchParams();


    query.set("patient", client.patient.id);
    query.set("_count", 100);
    query.set("_sort", "-date");
    query.set("code", [
        'http://loinc.org|8462-4',
        'http://loinc.org|8480-6',
        'http://loinc.org|2085-9',
        'http://loinc.org|2089-1',
        'http://loinc.org|55284-4',
        'http://loinc.org|3141-9',
        'http://loinc.org|8302-2',
        'http://loinc.org|29463-7',

    ].join(","));

    client.request("Observation?" + query, {
        pageLimit: 0,
        flat: true
    }).then(
        function (ob) {

            // group all of the observation resoruces by type into their own
            var byCodes = client.byCodes(ob, 'code');
            var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
            var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
            var hdl = byCodes('2085-9');
            var ldl = byCodes('2089-1');
            var height = byCodes('8302-2');
            var weight = byCodes('29463-7');
            var bmi;

            // create patient object
            var p = defaultPatient();
            p.weight = weight;
            p.height = height;
            p.dia = diastolicbp;
            p.sys = systolicbp;
            p.hdl = hdl;
            p.ldl = ldl;
            p.bmi = bmi;

            // set patient value parameters to the data pulled from the observation resoruce
          //  if (typeof height[0] != 'undefined' && typeof height[0].valueQuantity.value != 'undefined' && typeof height[0].valueQuantity.unit != 'undefined') {
          //      p.height = height[0].valueQuantity.value + ' ' + height[0].valueQuantity.unit;
          //  }

            if (typeof weight[0] != 'undefined' && typeof weight[0].valueQuantity.value != 'undefined' && typeof weight[0].valueQuantity.unit != 'undefined') {
                p.weight = weight[0].valueQuantity.value + ' ' + weight[0].valueQuantity.unit;
            }

            if (typeof systolicbp != 'undefined') {
                p.sys = systolicbp;
            }

            if (typeof diastolicbp != 'undefined') {
                p.dia = diastolicbp;
            }

            //
           // (p.bmi) = (weight)/(0.01*height)^2;
          //  if (typeof bmi != 'undefined') {
           //     p.bmi = (weight[0])/(0.01*height[0])^2;
           // }


                //(weight[0].valueQuantity.value)/(0.01*height[0].valueQuantity.value)^2;


            if (typeof hdl[0] != 'undefined' && typeof hdl[0].valueQuantity.value != 'undefined' && typeof hdl[0].valueQuantity.unit != 'undefined') {
                p.hdl = hdl[0].valueQuantity.value + ' ' + hdl[0].valueQuantity.unit;
            }

            if (typeof ldl[0] != 'undefined' && typeof ldl[0].valueQuantity.value != 'undefined' && typeof ldl[0].valueQuantity.unit != 'undefined') {
                p.ldl = ldl[0].valueQuantity.value + ' ' + ldl[0].valueQuantity.unit;
            }


            displayObservation(p)
            ret.resolve(p);


        });



  //update function to take in text input from the app and add the note for the latest bmi observation annotation
  //you should include text and the author can be set to anything of your choice. keep in mind that this data will
  // be posted to a public sandbox
  function addWeightAnnotation() {
    var annotation = "test annotation"
    displayAnnotation(annotation);

  }






  //event listner when the add button is clicked to call the function that will add the note to the weight observation
  document.getElementById('add').addEventListener('click', addWeightAnnotation);


}).catch(console.error);