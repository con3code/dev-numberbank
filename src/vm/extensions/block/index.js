// NumberBank for Xcratch
// 20220606 - ver1.0(067)
// 20221126 - dev ver(027)
//

import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './numberbank_icon.png';

//Dev:
//import { initializeApp, deleteApp } from '/usr/local/xcratch/scratch-gui/node_modules/firebase/app';
//import * as firestore from '/usr/local/xcratch/scratch-gui/node_modules/firebase/firestore';
//import { getFirestore, doc, getDoc, setDoc } from '/usr/local/xcratch/scratch-gui/node_modules/firebase/firestore/lite';
//Relese:
import { initializeApp, deleteApp } from 'firebase/app';
import * as firestore from 'firebase/firestore';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore/lite';

//
// import * as firestore from 'firebase/firestore/lite';
// import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore/lite';

//Dev:
//import Variable from '/usr/local/xcratch/scratch-gui/node_modules/scratch-vm/src/engine/variable';
//Relese:
import Variable from '../../engine/variable';

const encoder = new TextEncoder();
const deoder_utf8 = new TextDecoder('utf-8');


// API呼び出しを管理するキュー
let apiCallQueue = [];
let processing = false;


/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.defaultMessage;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'numberbank';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://con3office.github.io/dev-numberbank/dist/numberbank.mjs';



/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME() {
        return formatMessage({
            id: 'numberbank.name',
            default: 'NumberBank',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID() {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL() {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL(url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for NumberBank1.0.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor(runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }
    }



    putNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(); }

            if (args.BANK == '' || args.CARD == '' || args.NUM == '') { resolve(); }

            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);

            uniKey = bankKey.trim().concat(cardKey.trim());

            if (args.NUM != '' && args.NUM != undefined) {
                settingNum = args.NUM;
            }

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }

            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);

                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            const now = Date.now();
                            const cardDocRef = doc(db, 'card', uniSha256);
                            const bankDocRef = doc(db, 'bank', bankSha256);

                            enqueueApiCall(() => {
                                return setDoc(cardDocRef, {
                                    number: settingNum,
                                    bank_key: bankSha256,
                                    card_key: cardSha256,
                                    master_key: masterSha256,
                                    time_stamp: now
                                })
                                .then(() => {
                                    return setDoc(bankDocRef, {
                                        bank_name: bankName,
                                        time_stamp: now
                                    });
                                })
                                .catch(error => {
                                    console.error("Error writing document: ", error);
                                    reject();
                                });
                            });
                            
                            resolve();

                        } else {
                            console.log("No MasterKey!");
                            resolve();
                        }
                    }).catch(error => {
                        console.error("Error: ", error);
                        reject(error);  // エラーを拒否値として返す
                    });
            } else {
                resolve();
            }
        }).then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, interval.MsPut);
            });
        });
        
    }


    setNum(args, util) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(); }

            if (args.BANK == '' || args.CARD == '') { resolve(); }

            const variable = util.target.lookupOrCreateVariable(null, args.VAL);

            bankKey = bankName = new String(args.BANK);
            cardKey = new String(args.CARD);

            uniKey = bankKey.trim().concat(cardKey.trim());

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }

            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);

                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            enqueueApiCall(() => {
                                return getDoc(doc(db, 'card', uniSha256))
                                    .then(docSnapshot => {
                                        if (docSnapshot.exists()) {
                                            let data = docSnapshot.data();
                                            variable.value = data.number;
                                            resolve();
                                        } else {
                                            variable.value = '';
                                            resolve();
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error getting document: ", error);
                                        reject();
                                    })
                            });
                            
                            resolve();

                        } else {
                            console.log("No MasterKey!");
                            resolve();
                        }
                    });
            } else {
                resolve();
            }
        }).then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, interval.MsSet);
            });
        });
        
    }


    getNum(args) {
        return new Promise((resolve, reject) => {
            cloudNum = '';

            if (masterSha256 == '') { resolve(''); }

            if (args.BANK == '' || args.CARD == '') { resolve(''); }

            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);

            uniKey = bankKey.trim().concat(cardKey.trim());

            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }

            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);

                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);

                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            enqueueApiCall(() => {
                                return getDoc(doc(db, 'card', uniSha256))
                                    .then(docSnapshot => {
                                        if (docSnapshot.exists()) {
                                            let data = docSnapshot.data();
                                            cloudNum = data.number;
                                            resolve(cloudNum);
                                        } else {
                                            cloudNum = '';
                                            resolve(cloudNum);
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error getting document: ", error);
                                        reject(error);
                                    })
                            });

                        } else {
                            console.log("No MasterKey!");
                            resolve('');
                        }
                    });
            } else {
                resolve('');
            }
        }).then((ret) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ret);
                }, interval.MsGet);
            });
        });
    }


    repNum(args, util) {
        return cloudNum;
    }


    repCloudNum(args) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); }
            if (args.BANK == '' || args.CARD == '') { resolve(''); }
    
            let rep_cloudNum = '';
    
            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);
    
            uniKey = bankKey.trim().concat(cardKey.trim());
    
            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }
    
            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(bankKey))
                    .then(bankStr => {
                        bankSha256 = hexString(bankStr);
    
                        return crypto.subtle.digest('SHA-256', encoder.encode(cardKey));
                    })
                    .then(cardStr => {
                        cardSha256 = hexString(cardStr);
    
                        return crypto.subtle.digest('SHA-256', encoder.encode(uniKey));
                    })
                    .then(uniStr => {
                        uniSha256 = hexString(uniStr);
    
                        return sleep(1);
                    })
                    .then(() => {
                        if (masterSha256 != '' && masterSha256 != undefined) {
                            enqueueApiCall(() => {
                                return getDoc(doc(db, 'card', uniSha256))
                                    .then(docSnapshot => {
                                        if (docSnapshot.exists()) {
                                            let data = docSnapshot.data();
                                            rep_cloudNum = data.number;
                                            resolve(rep_cloudNum);  // rep_cloudNumを直接返す
                                        } else {
                                            rep_cloudNum = '';
                                            resolve(rep_cloudNum);  // rep_cloudNumを直接返す
                                        }
                                    })
                                    .catch(error => {
                                        console.error("Error getting document: ", error);
                                        reject(error);  // エラーを拒否値として返す
                                    })
                            });

                        } else {
                            console.log("No MasterKey!");
                            resolve('');  // MasterKeyがない場合は空文字を返す
                        }
                    })
                    .catch(error => {
                        console.error("Error: ", error);
                        reject(error);  // エラーを拒否値として返す
                    });
            } else {
                resolve('');  // bankKeyがない場合は空文字を返す
            }
        }).then((ret) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ret);
                }, interval.MsRep);
            });
        });

    }


    boolAvl(args, util) {
        return new Promise((resolve, reject) => {
            if (masterSha256 == '') { resolve(''); }
            if (args.BANK == '' || args.CARD == '') { resolve(false); }
    
            bankKey = new String(args.BANK);
            bankName = args.BANK;
            cardKey = new String(args.CARD);
    
            uniKey = bankKey.trim().concat(cardKey.trim());
    
            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }
    
            if (bankKey != '' && bankKey != undefined) {
                crypto.subtle.digest('SHA-256', encoder.encode(uniKey))
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
    
                    return sleep(1);
                })
                .then(() => {
                    if (masterSha256 != '' && masterSha256 != undefined) {
                        enqueueApiCall(() => {
                            return getDoc(doc(db, 'card', uniSha256))
                                .then(ckey => {
                                    if (ckey.exists()) {
                                        resolve(true);
                                    } else {
                                        resolve(false);
                                    }
                                })
                                .catch(error => {
                                    console.log("Error checking document:", error);
                                    reject(error);
                                })
                        });
                        
                    } else {
                        console.log("No MasterKey!");
                        reject('');
                    }
                });
            } else {
                resolve('');
            }
        }).then((ret) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ret);
                }, interval.MsAvl);
            });
        });

    }


    setMaster(args) {
        return new Promise((resolve, reject) => {
            if (args.KEY == '') { resolve(''); }
    
            if (inoutFlag_setting) { resolve(''); }
            inoutFlag_setting = true;
            inoutFlag = true;
    
            masterSha256 = '';
            masterSetted = args.KEY;
    
            mkbUrl = FBaseUrl + 'mkeybank/?mkey=' + masterSetted;
            mkbRequest = new Request(mkbUrl, { mode: 'cors' });
    
            if (!crypto || !crypto.subtle) {
                reject("crypto.subtle is not supported.");
            }
    
            crypto.subtle.digest('SHA-256', encoder.encode(masterSetted))
                .then(masterStr => {
                    masterSha256 = hexString(masterStr);
    
                    return fetch(mkbRequest);

                }).then(response => {

                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Unexpected responce status ${response.status} or content type');
                    }
    
                }).then((resBody) => {
    
                    cloudConfig_mkey.masterKey = resBody.masterKey;
                    cloudConfig_mkey.cloudType = resBody.cloudType;
                    cloudConfig_mkey.apiKey = resBody.apiKey;
                    cloudConfig_mkey.authDomain = resBody.authDomain;
                    cloudConfig_mkey.databaseURL = resBody.databaseURL;
                    cloudConfig_mkey.projectId = resBody.projectId;
                    cloudConfig_mkey.storageBucket = resBody.storageBucket;
                    cloudConfig_mkey.messagingSenderId = resBody.messagingSenderId;
                    cloudConfig_mkey.appId = resBody.appId;
                    cloudConfig_mkey.measurementId = resBody.measurementId;
                    cloudConfig_mkey.cccCheck = resBody.cccCheck;
                    interval.MsPut = resBody.intervalMsPut;
                    interval.MsSet = resBody.intervalMsSet;
                    interval.MsGet = resBody.intervalMsGet;
                    interval.MsRep = resBody.intervalMsRep;
                    interval.MsAvl = resBody.intervalMsAvl;
    
    
                    inoutFlag = false;
                    crypt_decode(cloudConfig_mkey, firebaseConfig);
                    return ioWaiter(1);
    
                }).then(() => {
                    inoutFlag = true;
    
                    // Initialize Firebase
    
                    if (cloudFlag) {
    
                        deleteApp(fbApp)
                        .then(() => {
                            cloudFlag = false;
                            fbApp = initializeApp(firebaseConfig);
                            db = getFirestore(fbApp);
                            inoutFlag = false;
                        })
                        .catch((err) => {
                            console.log('Err deleting app:', err);
                            inoutFlag = false;
                        })
    
                    } else {
    
                        fbApp = initializeApp(firebaseConfig);
                        db = getFirestore(fbApp);
                        inoutFlag = false;
    
                    }
    
                    return ioWaiter(1);
    
                }).then(() => {
                    masterKey = masterSetted;
                    cloudFlag = true;
                    inoutFlag_setting = false;
                    inoutFlag = false;
                    console.log("= MasterKey:", masterSetted);
                    console.log('= Interval:', interval);
                    console.log("= MasterKey Accepted! =");

                    return ioWaiter(1);
    
                })
                .then(() => {
                    resolve(masterKey);  // masterKeyを直接返す
                })
                .catch(function (error) {
                    inoutFlag_setting = false;
                    inoutFlag = false;
                    console.error("Error setting MasterKey:", error);
                    console.log("No such MasterKey!");
                    reject(error);
                });
        });
    }


    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            blocks: [
                {
                    opcode: 'putNum',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'numberbank.putNum',
                        default: 'put[NUM]to[CARD]of[BANK]',
                        description: 'put number to Firebase'
                    }),
                    arguments: {
                        BANK: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.bank',
                                default: 'bank'
                            })
                        },
                        CARD: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.card',
                                default: 'card'
                            })
                        },
                        NUM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        }
                    }
                },
                '---',
                {
                    opcode: 'setNum',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'numberbank.setNum',
                        default: 'set [VAL] to number of[CARD]of[BANK]',
                        description: 'set number by Firebase'
                    }),
                    arguments: {
                        BANK: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.bank',
                                default: 'bank'
                            })
                        },
                        CARD: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.card',
                                default: 'card'
                            })
                        },
                        VAL: {
                            type: ArgumentType.STRING,
                            fieldName: 'VARIABLE',
                            variableType: Variable.SCALAR_TYPE,
                            menu: 'valMenu'
                        }
                    }
                },
                '---',
                {
                    opcode: 'getNum',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'numberbank.getNum',
                        default: 'get number of[CARD]of[BANK]',
                        description: 'get number from Firebase'
                    }),
                    arguments: {
                        BANK: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.bank',
                                default: 'bank'
                            })
                        },
                        CARD: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.card',
                                default: 'card'
                            })
                        }
                    }
                },
                {
                    opcode: 'repNum',
                    text: formatMessage({
                        id: 'numberbank.repNum',
                        default: 'cloud number',
                        description: 'report Number'
                    }),
                    blockType: BlockType.REPORTER
                },
                '---',
                {
                    opcode: 'repCloudNum',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'numberbank.repCloudNum',
                        default: 'number of[CARD]of[BANK]',
                        description: 'report Cloud number'
                    }),
                    arguments: {
                        BANK: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.bank',
                                default: 'bank'
                            })
                        },
                        CARD: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.card',
                                default: 'card'
                            })
                        }
                    }
                },
                '---',
                {
                    opcode: 'boolAvl',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'numberbank.boolAvl',
                        default: '[CARD]of[BANK] available?',
                        description: 'report Number'
                    }),
                    arguments: {
                        BANK: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.bank',
                                default: 'bank'
                            })
                        },
                        CARD: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.card',
                                default: 'card'
                            })
                        }
                    }
                },
                '---',
                {
                    opcode: 'setMaster',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'numberbank.setMaster',
                        default: 'set Master[KEY]',
                        description: 'readFirebase'
                    }),
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'numberbank.argments.key',
                                default: 'key'
                            })
                        }
                    }

                }
            ],
            menus: {
                valMenu: {
                    acceptReporters: true,
                    items: 'getDynamicMenuItems'
                }
            }
        };
    }


    getDynamicMenuItems() {
        return this.runtime.getEditingTarget().getAllVariableNamesInScopeByType(Variable.SCALAR_TYPE);
    }


}


// キューの処理を行う関数
function processQueue() {
  if (processing || apiCallQueue.length === 0) {
    // 既に処理中、またはキューが空の場合は何もしない
    return;
  }
  processing = true;
  const apiCall = apiCallQueue.shift();

  apiCall().then(() => {
    processing = false;
    processQueue();
  }).catch(error => {
    console.error(error);
    processing = false;
    processQueue();
  });
}




// API呼び出しをキューに追加する関数
function enqueueApiCall(apiCall) {
    return new Promise((resolve, reject) => {
      apiCallQueue.push(() => apiCall().then(resolve).catch(reject));
      processQueue();
    });
}


function sleep(msec) {
    return new Promise(resolve =>
        setTimeout(() => {
            resolve();
        }, msec)
    );
}


function ioWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (inoutFlag) {
                reject();
            } else {
                resolve();
            }
        }, msec)
    )
        .catch(() => {
            return ioWaiter(msec);
        });
}


function availableWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (inoutFlag) {
                reject();
            } else {
                resolve(availableFlag);
            }
        }, msec)
    )
        .catch(() => {
            return availableWaiter(msec);
        });
}


function cloudWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (inoutFlag_setting) {
                reject();
            } else {
                resolve(cloudFlag);
            }
        }, msec)
    )
        .catch(() => {
            return cloudWaiter(msec);
        });
}


//
function hexString(textStr) {
    const byteArray = new Uint8Array(textStr);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode;
    });
    return hexCodes.join('');
}



// Firebase関連
var fbApp;
var db;


// Variables
let masterKey = '';
let masterSetted = '';
let bankName = '';
let bankKey = '';
let cardKey = '';
let uniKey = '';
let cloudNum = '';
let settingNum = '';
let masterSha256 = '';
let bankSha256 = '';
let cardSha256 = '';
let uniSha256 = '';
let inoutFlag = false;
let inoutFlag_setting = false;
let availableFlag = false;
let cloudFlag = false;
let mkbRequest;
let mkbUrl;
const FBaseUrl = 'https://us-central1-masterkey-bank.cloudfunctions.net/';


const interval = {
    MsPut: 1500,
    MsSet: 1000,
    MsGet: 1000,
    MsRep: 1000,
    MsAvl: 100,
}

const firebaseConfig = {
    masterKey: '',
    cloudType: '',
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// 格納用予備
const cloudConfig_mkb = {
    masterKey: '',
    cloudType: '',
    apiKey: '',
    authDomain: '',
    databaseURL: "",
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    Version: '',
    AccessKeyId: '',
    SecretAccessKey: '',
    SessionToken: '',
    Expiration: '',
    cccCheck: '',
};


// mKey格納用
const cloudConfig_mkey = {
    masterKey: '',
    cloudType: '',
    apiKey: '',
    authDomain: '',
    databaseURL: "",
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    Version: '',
    AccessKeyId: '',
    SecretAccessKey: '',
    SessionToken: '',
    Expiration: '',
    cccCheck: '',
};


// データ暗号化の下処理
/////////////////////////////////
/////////////////////////////////

function en_org(data) {
    return encoder.encode(data);
}

function en_store(data) {
    return firestore.Bytes.fromUint8Array(new Uint8Array(data)).toBase64();
}

function de_get(data) {
    return firestore.Bytes.fromBase64String(data).toUint8Array();
}

function de_disp(data) {
    return deoder_utf8.decode(data);
}

function en_crt(data) {
    return firestore.Bytes.fromUint8Array(data).toBase64();
}

function de_crt(data) {
    return firestore.Bytes.fromBase64String(data).toUint8Array();
}

////////////////////////////////
///////////////////////////////


function crypt_decode(cryptedConfigData, decodedConfigData) {

    decodedConfigData.cccCheck = cryptedConfigData.cccCheck;
    const cccCheck = de_crt(cryptedConfigData.cccCheck);

    const masterStr = crypto.subtle.digest('SHA-256', encoder.encode(masterSetted));
    const ckeyPromise = masterStr.then(masterStr => crypto.subtle.importKey('raw', masterStr, 'AES-CTR', false, ['encrypt', 'decrypt']));

    const propertiesToDecrypt = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];

    const decryptPromises = propertiesToDecrypt.map(property => {
        return ckeyPromise.then(ckey => {
            const cryptedData = de_get(cryptedConfigData[property]);
            return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, cryptedData);
        }).then(decodedData => {
            decodedConfigData[property] = de_disp(decodedData);
        }).catch(error => {
            console.error(`Error decrypting ${property}:`, error);
        });
    });

    return Promise.all(decryptPromises);
}


export {
    ExtensionBlocks as default,
    ExtensionBlocks as blockClass
};
