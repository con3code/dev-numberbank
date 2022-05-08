import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './numberbank_icon.png';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, terminate } from 'firebase/firestore/lite';
import Variable from '../../engine/variable';


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
let extensionURL = 'https://con3office.github.io/xcx-numberbank/dist/numberbank.mjs';



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
            default: 'NumberBank1.0',
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

        if (masterSha256 == '') { return; }

        if (args.BANK == '' || args.CARD == '' || args.NUM == '') { return; }

        if (inoutFlag) { return; }
        inoutFlag = true;

        //console.log("putNum...");

        bankKey = bankName = args.BANK;
        cardKey = args.CARD;

        uniKey = bankKey.trim().concat(cardKey.trim());
        //console.log("uniKey: " + uniKey);    

        if (args.NUM != '' && args.NUM != undefined) {
            settingNum = args.NUM;
            //console.log("settingNum: " + settingNum);    
        }

        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        if (bankKey != '' && bankKey != undefined) {
            //bankKey
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(bankKey))
                .then(bankStr => {
                    bankSha256 = hexString(bankStr);
                    //console.log("bankSha256: " + bankSha256);

                    //cardKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardKey));
                })
                .then(cardStr => {
                    cardSha256 = hexString(cardStr);
                    //console.log("cardSha256: " + cardSha256);

                    //uniKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(uniKey));
                })
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
                    //console.log("uniSha256: " + uniSha256);

                    return sleep(1);
                })
                .then(() => {
                    //console.log("masterSha256: " + masterSha256);

                    // console.log('cloudConfig_mkey:', firebaseConfig);

                    if (masterSha256 != '' && masterSha256 != undefined) {
                        console.log("NumberBank put 00");

                        const now = Date.now();
                        setDoc(doc(db, 'card', uniSha256), {
                            number: settingNum,
                            bank_key: bankSha256,
                            card_key: cardSha256,
                            master_key: masterSha256,
                            time_stamp: now
                        })
                            .then(() => {
                                console.log("NumberBank put 01");
                                return setDoc(doc(db, 'bank', bankSha256), {
                                    bank_name: bankName,
                                    time_stamp: now
                                });
                            })
                            .then(() => {
                                console.log("NumberBank put 02");
                                inoutFlag = false;
                            })
                            .catch(function (error) {
                                console.error("Error writing document: ", error);
                                inoutFlag = false;
                            });

                    } else {
                        console.log("No MasterKey!");
                        inoutFlag = false;
                    }

                    console.log("NumberBank put 03");

                });

        }

        console.log("NumberBank put ioWaiter");

        return ioWaiter(interval.MsPut);

    }


    setNum(args, util) {

        if (masterSha256 == '') { return; }

        if (args.BANK == '' || args.CARD == '') { return; }

        if (inoutFlag) { return; }
        inoutFlag = true;

        //console.log("setNum...");

        const variable = util.target.lookupOrCreateVariable(null, args.VAL);

        bankKey = bankName = args.BANK;
        cardKey = args.CARD;

        uniKey = bankKey.trim().concat(cardKey.trim());
        //console.log("uniKey: " + uniKey);    

        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        if (bankKey != '' && bankKey != undefined) {
            //bankKey
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(bankKey))
                .then(bankStr => {
                    bankSha256 = hexString(bankStr);
                    //console.log("bankSha256: " + bankSha256);    

                    //cardKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardKey));
                })
                .then(cardStr => {
                    cardSha256 = hexString(cardStr);
                    //console.log("cardSha256: " + cardSha256);

                    //uniKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(uniKey));
                })
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
                    //console.log("uniSha256: " + uniSha256);

                    return sleep(1);
                })
                .then(() => {
                    //console.log("masterSha256: " + masterSha256);

                    if (masterSha256 != '' && masterSha256 != undefined) {

                        // console.log('cloudConfig_mkey:', firebaseConfig);

                        //v8
                        // cardDb.doc(uniSha256).get().then(function (ckey) {
                        getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
                            console.log("NumberBank set 00");

                            if (ckey.exists()) {
                                console.log("NumberBank set 01");

                                // cardDb.doc(uniSha256).get()
                                getDoc(doc(db, 'card', uniSha256))
                                    .then((doc) => {
                                        console.log("NumberBank set 02");
                                        let data = doc.data();
                                        variable.value = data.number;
                                    })
                                    .then(() => {
                                        inoutFlag = false;
                                    })
                                    .catch(function (error) {
                                        console.error("Error getting document: ", error);
                                    });

                            } else {
                                //console.log("No Card!");
                                variable.value = '';
                                inoutFlag = false;
                            }

                        }).catch(function (error) {
                            console.log("Error cheking document:", error);
                            inoutFlag = false;
                        });

                    } else {
                        // doc.data() will be undefined in this case
                        console.log("No MasterKey!");
                        inoutFlag = false;
                    }

                    console.log("NumberBank set 03");

                });

        }

        console.log("NumberBank set ioWaiter");

        return ioWaiter(interval.MsSet);

    }


    inoutDone() {
        return !inoutFlag;
    }


    getNum(args) {

        cloudNum = '';

        if (masterSha256 == '') { return; }

        if (args.BANK == '' || args.CARD == '') { return; }

        // console.log('args.BANK:', args.BANK);
        // console.log('args.CARD:', args.CARD);

        if (inoutFlag) { return; }
        inoutFlag = true;

        console.log("getNum...");

        bankKey = bankName = args.BANK;
        cardKey = args.CARD;

        uniKey = bankKey.trim().concat(cardKey.trim());
        // console.log('uniKey:' + uniKey);

        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        if (bankKey != '' && bankKey != undefined) {
            //bankKey
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(bankKey))
                .then(bankStr => {
                    bankSha256 = hexString(bankStr);
                    //console.log("bankSha256: " + bankSha256);

                    //cardKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardKey));
                })
                .then(cardStr => {
                    cardSha256 = hexString(cardStr);
                    //console.log("cardSha256: " + cardSha256);

                    //uniKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(uniKey));
                })
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
                    //console.log("uniSha256: " + uniSha256);

                    return sleep(1);
                })
                .then(() => {
                    // console.log("masterSha256: " + masterSha256);

                    // // console.log('cloudConfig_mkey:', firebaseConfig);
                    // console.log('db:', db);
                    // console.log('uniSha256:', uniSha256);

                    if (masterSha256 != '' && masterSha256 != undefined) {

                        getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
                            console.log("NumberBank get 00");
                            // console.log('ckey:', ckey);
                            // console.log('ckey.exists:', ckey.exists());

                            if (ckey.exists()) {
                                console.log("NumberBank get 01");

                                getDoc(doc(db, 'card', uniSha256))
                                    .then((doc) => {
                                        console.log("NumberBank get 02");
                                        let data = doc.data();
                                        cloudNum = data.number;
                                        console.log('cloudNum:', cloudNum);
                                    })
                                    .then(() => {
                                        console.log("NumberBank get 03");
                                        inoutFlag = false;
                                    })
                                    .catch(function (error) {
                                        console.error("Error getting document: ", error);
                                    });

                            } else {
                                console.log("NumberBank get 04");
                                console.log("No Card!");
                                cloudNum = '';
                                inoutFlag = false;
                            }

                        }).catch(function (error) {
                            console.log("Error cheking document:", error);
                            inoutFlag = false;
                        });

                    } else {
                        // doc.data() will be undefined in this case
                        console.log("No MasterKey!");
                        inoutFlag = false;
                    }

                    console.log("NumberBank get 05");

                });

        }

        console.log("NumberBank get ioWaiter");

        return ioWaiter(interval.MsGet);

    }


    repNum(args, util) {
        return cloudNum;
    }


    repCloudNum(args) {

        if (masterSha256 == '') { return; }

        if (args.BANK == '' || args.CARD == '') { return; }

        if (inoutFlag) { return; }
        inoutFlag = true;

        //console.log("repCloudNum...");

        bankKey = bankName = args.BANK;
        cardKey = args.CARD;

        uniKey = bankKey.trim().concat(cardKey.trim());
        //console.log("uniKey: " + uniKey);

        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        if (bankKey != '' && bankKey != undefined) {
            //bankKey
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(bankKey))
                .then(bankStr => {
                    bankSha256 = hexString(bankStr);
                    //console.log("bankSha256: " + bankSha256);

                    //cardKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(cardKey));
                })
                .then(cardStr => {
                    cardSha256 = hexString(cardStr);
                    //console.log("cardSha256: " + cardSha256);

                    //uniKey
                    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(uniKey));
                })
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
                    //console.log("uniSha256: " + uniSha256);

                    return sleep(1);
                })
                .then(() => {
                    //console.log("masterSha256: " + masterSha256);

                    // console.log('cloudConfig_mkey:', firebaseConfig);

                    if (masterSha256 != '' && masterSha256 != undefined) {

                        getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
                            console.log("NumberBank rep 00");

                            if (ckey.exists()) {
                                console.log("NumberBank rep 01");

                                getDoc(doc(db, 'card', uniSha256))
                                    .then((doc) => {
                                        console.log("NumberBank rep 02");
                                        let data = doc.data();
                                        cloudNum = data.number;
                                    })
                                    .then(() => {
                                        inoutFlag = false;
                                    })
                                    .catch(function (error) {
                                        console.error("Error getting document: ", error);
                                    });

                            } else {
                                //console.log("No Card!");
                                cloudNum = '';
                                inoutFlag = false;
                            }

                        }).catch(function (error) {
                            console.log("Error cheking document:", error);
                            inoutFlag = false;
                        });

                    } else {
                        // doc.data() will be undefined in this case
                        console.log("No MasterKey!");
                        inoutFlag = false;
                    }

                    console.log("NumberBank rep 03");

                });

        }

        console.log("NumberBank rep ioWaiter");

        return reportNumWaiter(interval.MsRep);

    }


    boolAvl(args, util) {

        if (masterSha256 == '') { return; }

        if (args.BANK == '' || args.CARD == '') { return; }

        if (inoutFlag) { return; }
        inoutFlag = true;

        //console.log("boolAvl...");

        bankKey = bankName = args.BANK;
        cardKey = args.CARD;

        uniKey = bankKey.trim().concat(cardKey.trim());
        //console.log("uniKey: " + uniKey);    

        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        if (bankKey != '' && bankKey != undefined) {
            //
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(uniKey))
                .then(uniStr => {
                    uniSha256 = hexString(uniStr);
                    // console.log("uniSha256: " + uniSha256);

                    return sleep(1);
                })
                .then(() => {
                    // console.log("masterSha256: " + masterSha256);

                    // console.log('cloudConfig_mkey:', firebaseConfig);

                    if (masterSha256 != '' && masterSha256 != undefined) {

                        getDoc(doc(db, 'card', uniSha256)).then(function (ckey) {
                            console.log("NumberBank avl 00");

                            if (ckey.exists()) {
                                console.log("NumberBank avl YES");
                                inoutFlag = false;
                                availableFlag = true;
                            } else {
                                console.log("NumberBank avl NO");
                                //console.log("No Available!");
                                inoutFlag = false;
                                availableFlag = false;
                            }

                        }).catch(function (error) {
                            console.log("Error checking document:", error);
                            inoutFlag = false;
                            availableFlag = false;
                        });

                    } else {
                        // doc.data() will be undefined in this case
                        console.log("No MasterKey!");
                        inoutFlag = false;
                        availableFlag = false;
                    }

                    console.log("NumberBank avl 03");

                })

        }

        console.log("NumberBank avl ioWaiter");

        return availableWaiter(interval.MsAvl);

    }


    setMaster(args) {

        if (args.KEY == '') { return; }


        //if (inoutFlag) { return; }
        if (inoutFlag_setting) { return; }
        inoutFlag = true;
        inoutFlag_setting = true;

        masterSha256 = '';
        masterKey = args.KEY;

        mkbUrl = mkbBaseUrl + '?mkey=' + masterKey;
        mkbRequest = new Request(mkbUrl, { mode: 'cors' });


        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        crypto.subtle.digest('SHA-256', new TextEncoder().encode(masterKey))
            .then(masterStr => {
                masterSha256 = hexString(masterStr);

                return fetch(mkbRequest);
            })
            .then(response => {

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

                console.log('cloudConfig_mkey:', cloudConfig_mkey);
                console.log('interval:', interval);
                console.log('firebaseConfig（復号前）:', firebaseConfig);

                crypt_decode(cloudConfig_mkey, firebaseConfig);
                // console.log('複号化から戻り');
                return ioWaiter(1);

            }).then(() => {
                inoutFlag = true;

                console.log('firebaseConfig（複合後）:', firebaseConfig);

                // Initialize Firebase

                if (cloudFlag) {
                    terminate(db).then(() => {
                        cloudFlag = false;
                        fbApp = initializeApp(firebaseConfig);
                        db = getFirestore(fbApp);

                    });
                } else {

                    fbApp = initializeApp(firebaseConfig);
                    db = getFirestore(fbApp);
                    // console.log('db:', db);

                }

                return sleep(1);

            }).then(() => {

                cloudFlag = true;
                inoutFlag_setting = false;
                // console.log("MasterKey:", masterKey);
                // console.log("masterSha256:", masterSha256);
                console.log("MasterKey setted!");

            })
            .catch(function (error) {

                cloudFlag = false;
                inoutFlag_setting = false;
                console.log("Error setting MasterKey:", error);

            });


        return cloudWaiter(1);

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

function reportNumWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (inoutFlag) {
                reject();
            } else {
                resolve(cloudNum);
            }
        }, msec)
    )
        .catch(() => {
            return reportNumWaiter(msec);
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



/*
// createHashはNodeの関数
// 機能拡張上では動作せず（025_）
const encryptSha256 = (str) => {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return hash.digest('hex')
}
*/


/*
// hexStringとの組合せ
// 拡張機能上では動作せず（026_）
const encryptSha256 = (str) => {
    const hash = SHA256(str);
    return hexString(hash)
}
*/


/*
// もともと
const encryptSha256 = (str) => {
    const hash = SHA256(str);
    return hash.toString()
}
*/


// Firebase関連
var fbApp;
var db;


// Variables
let masterKey = '';
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
const mkbBaseUrl = 'https://us-central1-masterkey-bank.cloudfunctions.net/mkeybank/';


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



function de_get(data) {
    return firestore.Bytes.fromBase64String(data).toUint8Array();
}

function de_disp(data) {
    return deoder_utf8.decode(data);
}


function de_crt(data) {
    return firestore.Bytes.fromBase64String(data).toUint8Array();
}



function crypt_decode(cryptedConfigData, decodedConfigData) {
    if (inoutFlag) { return; }
    inoutFlag = true;
    // console.log('inoutFlag(decode start):', inoutFlag);

    const cccCheck = de_crt(cryptedConfigData.cccCheck);

    let ckey;

    switch (cryptedConfigData.cloudType) {
        case 'firestore':
            console.log('switch to Firebase!');

            // masterKeyをハッシュ化
            crypto.subtle.digest('SHA-256', new TextEncoder().encode(masterKey))
                .then((masterStr) => {

                    // masterKeyからckey生成
                    return crypto.subtle.importKey('raw', masterStr, 'AES-CTR', false, ['encrypt', 'decrypt']);
                })
                .then((encodedKey) => {
                    ckey = encodedKey;
                    // console.log('ckey:', ckey);

                    // 復号化開始
                    // apiKey
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.apiKey));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.apiKey:', de_disp(decodedData));
                    decodedConfigData.apiKey = de_disp(decodedData);

                    // authDomain
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.authDomain));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.authDomain:', de_disp(decodedData));
                    decodedConfigData.authDomain = de_disp(decodedData);

                    // databaseURL
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.databaseURL));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.databaseURL:', de_disp(decodedData));
                    decodedConfigData.databaseURL = de_disp(decodedData);

                    // projectId
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.projectId));
                })
                .then((decodedData) => {
                    console.log('decodedConfigData.projectId:', de_disp(decodedData));
                    decodedConfigData.projectId = de_disp(decodedData);

                    // storageBucket
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.storageBucket));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.storageBucket:', de_disp(decodedData));
                    decodedConfigData.storageBucket = de_disp(decodedData);

                    // messagingSenderId
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.messagingSenderId));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.messagingSenderId:', de_disp(decodedData));
                    decodedConfigData.messagingSenderId = de_disp(decodedData);

                    // appId
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.appId));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.appId:', de_disp(decodedData));
                    decodedConfigData.appId = de_disp(decodedData);

                    // measurementId
                    return crypto.subtle.decrypt({ name: 'AES-CTR', counter: cccCheck, length: 64 }, ckey, de_get(cryptedConfigData.measurementId));
                })
                .then((decodedData) => {
                    // console.log('decodedConfigData.measurementId:', de_disp(decodedData));
                    decodedConfigData.measurementId = de_disp(decodedData);

                })
                .then(() => {
                    // console.log('key_org_result_textContent:', JSON.stringify(decodedConfigData));
                    // console.log('key_org_result_textContent:', JSON.stringify(decodedConfigData, null, '\t'));

                    inoutFlag = false;
                    // console.log('inoutFlag(decode end):', inoutFlag);
                    return decodedConfigData;

                })
                .catch((err) => {
                    console.log('decoding error:', err);
                });

            break;

        case 'dynamo':
            console.log('switch to Dynamo!');

            break;

        default:
            console.log('switch doesnt work!');

            break;
    }


}



export {
    ExtensionBlocks as default,
    ExtensionBlocks as blockClass
};
