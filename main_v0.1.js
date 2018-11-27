// ----------------------------------------------------//
// Se crean las instancias de las librerias a utilizar //
// ----------------------------------------------------//

  var modbus = require('jsmodbus');
  var fs = require('fs');
  var httpClient = require('node-rest-client').Client;
  var clientHttp = new httpClient();
//Asignar host, puerto y otros par ametros al cliente Modbus
var client = modbus.client.tcp.complete({
    'host': "192.168.20.19",
    'port': 502,
    'autoReconnect': true,
    'timeout': 60000,
    'logEnabled'    : true,
    'reconnectTimeout': 30000
}).connect();

var intId,timeStop=40,flagONS1=0,flagONS2=0,flagONS3=0;
var Filler,ctFiller=0,speedTempFiller=0,secFiller=0,stopCountFiller=0,flagStopFiller=0,flagPrintFiller=0,speedFiller=0,timeFiller=0;
var actualFiller=0,stateFiller=0;
var Casepacker,ctCasepacker=0,speedTempCasepacker=0,secCasepacker=0,stopCountCasepacker=0,flagStopCasepacker=0,flagPrintCasepacker=0,speedCasepacker=0,timeCasepacker=0;
var actualCasepacker=0,stateCasepacker=0;
var Checkweigher,ctCheckweigher=0,speedTempCheckweigher=0,secCheckweigher=0,stopCountCheckweigher=0,flagStopCheckweigher=0,flagPrintCheckweigher=0,speedCheckweigher=0,timeCheckweigher=0;
var actualCheckweigher=0,stateCheckweigher=0;
var publishConfig;
var Barcode,secBarcode=50;
var files = fs.readdirSync("/home/oee/Pulse/BYD_L15_LOGS/"); //Leer documentos
var text2send=[];//Vector a enviar
var i=0;


var secEOL=0,secPubNub=60*5;
// --------------------------------------------------------- //
//Función que realiza las instrucciones de lectura de datos  //
// --------------------------------------------------------- //
var DoRead = function (){
    client.readHoldingRegisters(0,60).then(function(resp){
        var statesFiller              = switchData(resp.register[0],resp.register[1]),
            statesCasepacker          = switchData(resp.register[2],resp.register[3]),
            statesCheckweigher        = switchData(resp.register[4],resp.register[5]);

          //Filler -------------------------------------------------------------------------------------------------------------
            ctFiller = joinWord(resp.register[13],resp.register[12]);
              if(flagONS1===0){
                speedTempFiller=ctFiller;
                flagONS1=1;
            }
            if (secFiller>=60){
                if(stopCountFiller===0||flagStopFiller==1){
                   flagPrintFiller=1;
                    secFiller=0;
                    speedFiller=ctFiller-speedTempFiller;
                    speedTempFiller=ctFiller;
                }
                if(flagStopFiller==1){
                    timeFiller=Date.now();
                }
            }
            secFiller++;
            if(ctFiller>actualFiller){
                stateFiller=1;//RUN
                if(stopCountFiller>=timeStop){
                    speedFiller=0;
                    secFiller=0;
                }
                timeFiller=Date.now();
                stopCountFiller=0;
                flagStopFiller=0;


            }else if(ctFiller==actualFiller){
                if(stopCountFiller===0){
                    timeFiller=Date.now();
                }
                stopCountFiller++;
                if(stopCountFiller>=timeStop){
                    stateFiller=2;//STOP
                    speedFiller=0;
                    if(flagStopFiller===0){
                        flagPrintFiller=1;
                        secFiller=0;
                    }
                    flagStopFiller=1;
                }
            }
            if(stateFiller==2){
                speedTempFiller=ctFiller;
            }

            actualFiller=ctFiller;
            if(stateFiller==2){
                if(statesFiller[5]==1){
                    stateFiller=3;//Wait
                }else{
                    if(statesFiller[4]==1){
                        stateFiller=4;//Block
                    }
                }
            }
            Filler = {
                ST: stateFiller,
                //CPQI: joinWord(resp.register[65],resp.register[64]),
                CPQO: joinWord(resp.register[13],resp.register[12]),
                //CPQR: joinWord(resp.register[63],resp.register[62]),
                SP: speedFiller
            };
            if(flagPrintFiller==1){
                for(var key in Filler){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L15_LOGS/pol_byd_Filler_L15.log","tt="+timeFiller+",var="+key+",val="+Filler[key]+"\n");
                }
                flagPrintFiller=0;
            }
          //Filler -------------------------------------------------------------------------------------------------------------
          //Casepacker -------------------------------------------------------------------------------------------------------------
            ctCasepacker = joinWord(resp.register[15],resp.register[14]);
              if(flagONS2===0){
                speedTempCasepacker=ctCasepacker;
                flagONS2=1;
            }
            if (secCasepacker>=60){
                if(stopCountCasepacker===0||flagStopCasepacker==1){
                   flagPrintCasepacker=1;
                    secCasepacker=0;
                    speedCasepacker=ctCasepacker-speedTempCasepacker;
                    speedTempCasepacker=ctCasepacker;
                }
                if(flagStopCasepacker==1){
                    timeCasepacker=Date.now();
                }
            }
            secCasepacker++;
            if(ctCasepacker>actualCasepacker){
                stateCasepacker=1;//RUN
                if(stopCountCasepacker>=timeStop){
                    speedCasepacker=0;
                    secCasepacker=0;
                }
                timeCasepacker=Date.now();
                stopCountCasepacker=0;
                flagStopCasepacker=0;


            }else if(ctCasepacker==actualCasepacker){
                if(stopCountCasepacker===0){
                    timeCasepacker=Date.now();
                }
                stopCountCasepacker++;
                if(stopCountCasepacker>=timeStop){
                    stateCasepacker=2;//STOP
                    speedCasepacker=0;
                    if(flagStopCasepacker===0){
                        flagPrintCasepacker=1;
                        secCasepacker=0;
                    }
                    flagStopCasepacker=1;
                }
            }
            if(stateCasepacker==2){
                speedTempCasepacker=ctCasepacker;
            }

            actualCasepacker=ctCasepacker;
            if(stateCasepacker==2){
                if(statesCasepacker[5]==1){
                    stateCasepacker=3;//Wait
                }else{
                    if(statesCasepacker[4]==1){
                        stateCasepacker=4;//Block
                    }
                }
            }
            Casepacker = {
                ST: stateCasepacker,
                CPQI: joinWord(resp.register[15],resp.register[14]),
                CPQO: joinWord(resp.register[17],resp.register[16]),
                //CPQR: joinWord(resp.register[63],resp.register[62]),
                SP: speedCasepacker
            };
            if(flagPrintCasepacker==1){
                for(var key in Casepacker){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L15_LOGS/pol_byd_Casepacker_L15.log","tt="+timeCasepacker+",var="+key+",val="+Casepacker[key]+"\n");
                }
                flagPrintCasepacker=0;
            }
          //Casepacker -------------------------------------------------------------------------------------------------------------
          //Checkweigher -------------------------------------------------------------------------------------------------------------
            ctCheckweigher = joinWord(resp.register[19],resp.register[18]);
              if(flagONS3===0){
                speedTempCheckweigher=ctCheckweigher;
                flagONS3=1;
            }
            if (secCheckweigher>=60){
                if(stopCountCheckweigher===0||flagStopCheckweigher==1){
                   flagPrintCheckweigher=1;
                    secCheckweigher=0;
                    speedCheckweigher=ctCheckweigher-speedTempCheckweigher;
                    speedTempCheckweigher=ctCheckweigher;
                }
                if(flagStopCheckweigher==1){
                    timeCheckweigher=Date.now();
                }
            }
            secCheckweigher++;
            if(ctCheckweigher>actualCheckweigher){
                stateCheckweigher=1;//RUN
                if(stopCountCheckweigher>=timeStop){
                    speedCheckweigher=0;
                    secCheckweigher=0;
                }
                timeCheckweigher=Date.now();
                stopCountCheckweigher=0;
                flagStopCheckweigher=0;


            }else if(ctCheckweigher==actualCheckweigher){
                if(stopCountCheckweigher===0){
                    timeCheckweigher=Date.now();
                }
                stopCountCheckweigher++;
                if(stopCountCheckweigher>=timeStop){
                    stateCheckweigher=2;//STOP
                    speedCheckweigher=0;
                    if(flagStopCheckweigher===0){
                        flagPrintCheckweigher=1;
                        secCheckweigher=0;
                    }
                    flagStopCheckweigher=1;
                }
            }
            if(stateCheckweigher==2){
                speedTempCheckweigher=ctCheckweigher;
            }

            actualCheckweigher=ctCheckweigher;
            if(stateCheckweigher==2){
                if(statesCheckweigher[5]==1){
                    stateCheckweigher=3;//Wait
                }else{
                    if(statesCheckweigher[4]==1){
                        stateCheckweigher=4;//Block
                    }
                }
            }
            Checkweigher = {
                ST: stateCheckweigher,
                CPQI: joinWord(resp.register[19],resp.register[18]),
                CPQO: joinWord(resp.register[21],resp.register[20]),
                CPQR: joinWord(resp.register[23],resp.register[22]),
                SP: speedCheckweigher
            };
            if(flagPrintCheckweigher==1){
                for(var key in Checkweigher){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L15_LOGS/pol_byd_Checkweigher_L15.log","tt="+timeCheckweigher+",var="+key+",val="+Checkweigher[key]+"\n");
                }
                flagPrintCheckweigher=0;
            }
          //Checkweigher -------------------------------------------------------------------------------------------------------------
          //EOL --------------------------------------------------------------------------------------------------------------------
          if(secEOL>=60){
            fs.appendFileSync("../BYD_L15_LOGS/pol_byd_EOL_L15.log","tt="+Date.now()+",var=EOL"+",val="+joinWord(resp.register[25],resp.register[24])+"\n");
            secEOL=0;
          }
          secEOL++;
          //EOL --------------------------------------------------------------------------------------------------------------------
                    //Barcode -------------------------------------------------------------------------------------------------------------
                    if(resp.register[40]==0&&resp.register[41]==0&&resp.register[42]==0&&resp.register[43]==0&&resp.register[44]==0&&resp.register[45]==0&&resp.register[46]==0&&resp.register[47]==0){
                      Barcode='0';
                    }else {

                      var dig1=hex2a(assignment(resp.register[40]).toString(16));
                      var dig2=hex2a(assignment(resp.register[41]).toString(16));
                      var dig3=hex2a(assignment(resp.register[42]).toString(16));
                      var dig4=hex2a(assignment(resp.register[43]).toString(16));
                      var dig5=hex2a(assignment(resp.register[44]).toString(16));
                      var dig6=hex2a(assignment(resp.register[45]).toString(16));
                      var dig7=hex2a(assignment(resp.register[46]).toString(16));
                      var dig8=hex2a(assignment(resp.register[47]).toString(16));

                    Barcode=dig1+dig2+dig3+dig4+dig5+dig6+dig7+dig8;}
                    if(isNaN(Barcode)){
                      Barcode='0';
                    }
          	        if(secBarcode>=60){
                        writedataBarcode(Barcode,"pol_byd_Barcode_L15.log");
                        secBarcode=0;
                    }
                    secBarcode++;
                    //Barcode -------------------------------------------------------------------------------------------------------------
          if(secPubNub>=60*5){
            function idle(){
              i=0;
              text2send=[];
              for ( k=0;k<files.length;k++){//Verificar los archivos
                var stats = fs.statSync("/home/oee/Pulse/BYD_L15_LOGS/"+files[k]);
                var mtime = new Date(stats.mtime).getTime();
                if (mtime< (Date.now() - (3*60*1000))&&files[k].indexOf("serialbox")==-1){
                  flagInfo2Send=1;
                  text2send[i]=files[k];
                  i++;
                }
              }
            }
            idle();
            secPubNub=0;
            publishConfig = {
              headers: { "Content-Type": "application/json" },
              data: {              message : {
                                  line: "15",
                                  tt: Date.now(),
                                  machines:text2send
                                }}
            };
            senderData();
          }
          secPubNub++;
    });//END Client Read
};
// registering remote methods
clientHttp.registerMethod("postMethod", "http://35.160.68.187:23000/heartbeatLine/Byd", "POST");


function senderData(){
  clientHttp.methods.postMethod(publishConfig, function (data, response) {
      // parsed response body as js object
      console.log(data.toString());
  });
}
var assignment = function (val){
  var result;
  if(val<4095)
    result = "";
  else
    result = val;
    return result;
};

function hex2a(hex){
   var str = '';
   for (var i = 0; i < hex.length; i += 2)
   str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}
var stateMachine = function (data){
	if(data[7]==1){
		return 1;//RUN
	}
	if(data[6]==1){
		return 2;//STOP
	}
	if(data[5]==1){
		return 3;//WAIT
	}
	if(data[4]==1){
		return 4;//BLOCK
	}
	return 2;
};

var counterState = function (actual,temp){
	if(actual!=temp){
		return 1;
	}else {
		return 2;
	}
};

var writedata = function (varJson,nameFile){
    var data;
    var timet=Date.now();
    for(var key in varJson){
        fs.appendFileSync("/home/pi/Pulse/BYD_L15_LOGS/"+nameFile,"tt="+timet+",var="+key+",val="+varJson[key]+"\n");
    }
};
var writedataBarcode = function (barcode,nameFile){
    var timet=Date.now();
    fs.appendFileSync("/home/oee/Pulse/BYD_L15_LOGS/"+nameFile,"tt="+timet+",var=bc"+",val="+barcode+"\n");
};
var joinWord = function (num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
         bin2=num2.toString(2),
         newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[31-i]=bin1[(bin1.length-1)-i];
        }
        for(var j=0;j<bin2.length;j++){
            newNum[15-j]=bin2[(bin2.length-1)-j];
        }
        bits=newNum.join("");
        return parseInt(bits,2);
};
var switchData = function (num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
        bin2=num2.toString(2),
        newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[15-i]=bin1[(bin1.length-1)-i];
        }
        for(var j=0;j<bin2.length;j++){
            newNum[31-j]=bin2[(bin2.length-1)-j];
        }
        bits=newNum.join("");

        return bits;
};

var stop = function () {
    ///This function clean data
    clearInterval(intId);
    process.exit(0);
};

var shutdown = function () {
    ///Use function STOP and close connection
    stop();
    client.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


///*If client is connect call a function "DoRead"*/
client.on('connect', function(err) {
    setInterval(function(){
        DoRead();
    }, 1000);
});

///*If client is in a error ejecute an acction*/
client.on('error', function (err) {
    fs.appendFileSync("error.log","ID 1: "+Date.now()+": "+err+"\n");
    //console.log('Client Error', err);
});
///If client try closed, this metodo try reconnect client to server
client.on('close', function () {
    //console.log('Client closed, stopping interval.');
    fs.appendFileSync("error.log","ID 2: "+Date.now()+": "+'Client closed, stopping interval.'+"\n");
    stop();
});
