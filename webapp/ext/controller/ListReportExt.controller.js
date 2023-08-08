sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/m/MessageToast"
    , "xlsx",
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/model/Filter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/date/UI5Date",
    "sap/ui/model/FilterOperator",
],
    function (Fragment, MessageToast
        , XLSX, ControllerExtension, Filter, JSONModel, UI5Date, FilterOperator
    ) {
        "use strict";
        return {
            // this variable will hold the data of excel file

            excelSheetsData: [],
            onInit: function () {
                //this.getView().byId('scoe003::sap.suite.ui.generic.template.ListReport.view.ListReport::ZZ_CV_00_PLNSPRMC--addEntry').setVisible(false);
                var oModel = new JSONModel();
                oModel.setData({
                    fYear: "",
                    fPeriod: 0,
                    Company_Code: "",
                    shipment: false,
                    rawMaterial: false,
                    create: true
                });
                this.getView().setModel(oModel, 'data');
            },
            onExcelUpload: function (oEvent) {
                console.log(XLSX.version)
                var oView = this.getView();
                if (!this.pDialog) {
                    Fragment.load({
                        id: "excel_upload",
                        name: "scoe003.ext.fragment.ExcelUpload",
                        type: "XML",
                        controller: this
                    }).then((oDialog) => {
                        let dataModel = this.getView().getModel('data');
                        let defModel = this.getView().getModel()
                        Fragment.byId("excel_upload", "uploadDialogSet").setModel(dataModel, 'data');
                        Fragment.byId("excel_upload", "uploadDialogSet").setModel(defModel);
                        var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                        oFileUploader.removeAllItems();
                        this.pDialog = oDialog;
                        this.pDialog.open();
                    })
                        .catch(error => alert(error.message));
                } else {
                    var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                    oFileUploader.removeAllItems();
                    this.pDialog.open();
                }
            },
            onSuggest: function (oEvent) {
                var sTerm = oEvent.getParameter("suggestValue");
                var aFilters = [];
                if (sTerm) {
                    aFilters.push(new Filter("CompanyCode", FilterOperator.StartsWith, sTerm));
                }

                oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            },
            onUploadSet: function (oEvent) {
                /*console.log("Upload Button Clicked!!!")
                 TODO:Call to OData */
                // checking if excel file contains data or not
                let oData = this.getView().getModel('data').getData();
                let errIndex = 1;
                let errMsg = "Resolve the following error before proceding. ";
                if (oData.Company_Code == "") {
                    errMsg = errMsg + "Enter valid Company Code."
                    MessageToast.show(errMsg);
                    return;
                }
                if (oData.fYear == "") {
                    errMsg = errMsg + "Enter valid Fiscal year. "
                    MessageToast.show(errMsg);
                    return;
                }
                if (oData.fPeriod > 12 || oData.fPeriod === 0) {
                    errMsg = errMsg + "Enter valid Fiscal period."
                    MessageToast.show(errMsg);
                    return;
                }
                if (!this.excelSheetsData.length) {
                    errMsg = errMsg + "Select file to Upload. "
                    MessageToast.show(errMsg);
                    return;

                }

                var that = this;
                var oSource = oEvent.getSource();

                // creating a promise as the extension api accepts odata call in form of promise only
                var fnAddMessage = function () {
                    return new Promise((fnResolve, fnReject) => {
                        that.callOdata(fnResolve, fnReject);
                    });
                };

                var mParameters = {
                    sActionLabel: oSource.getText() // or "Your custom text" 
                };
                // calling the oData service using extension api
                this.extensionAPI.securedExecution(fnAddMessage, mParameters);

                this.pDialog.close();
            },
            onTempDownload: function (oEvent) {
                /*console.log("Template Download Button Clicked!!!")
                  TODO: Excel file template download */
                // get the odata model binded to this application
                var oModel = this.getView().getModel();
                // get the property list of the entity for which we need to download the template
                var oDownload = oModel.getServiceMetadata().dataServices.schema[0].entityType.find(x => x.name === 'DownloadType');
                // set the list of entity property, that has to be present in excel file template
                var propertyList = ['Company_Code', 'Plant', 'Material', 'type',
                    'flag', 'vendor', 'plan_date', 'fiscal_year', 'fiscal_period', 'Period0',
                    'Period1', 'Period2', 'Period3', 'Period4', 'Period5', 'Period6', 'Period7', 'Period8'
                    , 'Period9', 'Period10', 'Period11', 'Period12', 'Period13', 'Period14', 'Period15', 'Period16',
                    'Period17', 'Period0', 'Update_Reason'];

                var excelColumnList = [];
                var colList = {};
                // finding the property description corresponding to the property id
                /* propertyList.forEach((value, index) => {
                   let property = oDownload.property.find(x => x.name === value);
                   colList[property.extensions.find(x => x.name === 'label').value] = '';
               }); */
                excelColumnList.push(colList);

                // initialising the excel work sheet
                const ws = XLSX.utils.json_to_sheet(excelColumnList);
                // creating the new excel work book
                const wb = XLSX.utils.book_new();
                // set the file value
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                // download the created excel file
                XLSX.writeFile(wb, 'RAP - Download.xlsx');

                MessageToast.show("Template File Downloading...");
            },
            onCloseDialog: function (oEvent) {
                this.pDialog.close();
            },
            onBeforeUploadStart: function (oEvent) {
                console.log("File Before Upload Event Fired!!!")
                /* TODO: check for file upload count */
            },
            onDownloadLog: function (data) {
                // initialising the excel work sheet
                const ws = XLSX.utils.json_to_sheet(data);
                // creating the new excel work book
                const wb = XLSX.utils.book_new();
                // set the file value
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                // download the created excel file
                XLSX.writeFile(wb, 'RAP - Download.xlsx');
            },
            onUploadSetComplete1: function (oEvent) {
                /*console.log("File Uploaded!!!")
                 TODO: Read excel file data*/
                // getting the UploadSet Control reference
                this.excelSheetsData = [];
                var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                // since we will be uploading only 1 file so reading the first file object
                var oFile = oFileUploader.getItems()[0].getFileObject();

                var reader = new FileReader();
                var that = this;

                reader.onload = (e) => {
                    // getting the binary excel file content
                    let xlsx_content = e.currentTarget.result;

                    let workbook = XLSX.read(xlsx_content, { type: 'binary' });
                    // here reading only the excel file sheet- Sheet1
                    var excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["Sheet1"]);

                    workbook.SheetNames.forEach(function (sheetName) {
                        // appending the excel file data to the global variable
                        that.excelSheetsData.push(XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]));
                    });
                    console.log("Excel Data", excelData);
                    console.log("Excel Sheets Data", this.excelSheetsData);
                };
                reader.readAsBinaryString(oFile);

                MessageToast.show("Upload Successful");
            },
            onUploadSetComplete: function (oEvent) {
                var that = this;
                //  var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                var fU = Fragment.byId("excel_upload", "uploadSet");
                // var domRef = fU.getFocusDomRef();
                var file = fU.getItems()[0].getFileObject();
                var reader = new FileReader();
                var params = "";
                that.excelSheetsData = [];
                reader.onload = function (oEvent) {
                    var strCSV = oEvent.target.result;
                    var arrCSV = strCSV.match(/[\w .]+(?=,?)/g);
                    var newArray = strCSV.split('\r\n');
                    var noOfCols = 29;
                    var headerRow = newArray[0].match(/[\w .]+(?=,?)/g);
                    //arrCSV.splice(0, noOfCols);
                    var data = [];
                    let index = 1;
                    while (newArray.length > index) {

                        var obj = {};
                        var row = newArray[index].split(',');
                        if (row.length >= noOfCols) {
                            for (var i = 0; i < row.length; i++) {
                                obj[headerRow[i]] = row[i].trim();
                            }
                            data.push(obj);
                        }
                        index += 1;
                    }
                    var Len = data.length;
                    data.reverse();


                    that.excelSheetsData.push(data);

                }
                reader.readAsBinaryString(file);
            },
            onItemRemoved: function (oEvent) {
                /*console.log("File Remove/delete Event Fired!!!")  
                 TODO: Clear the already read excel file data */
                this.excelSheetsData = [];
            },
            // helper method to call OData
            callOdata: function (fnResolve, fnReject) {
                //  intializing the message manager for displaying the odata response messages
                var oModel = this.getView().getModel();
                // creating odata payload object for Upload data entity
                var payload = {};
                this.rowCount = this.excelSheetsData[0].length;
                this.currentCount = 0; this.payload = []; this.downloadData = [];
                this.excelSheetsData[0].forEach((value, index) => {

                    try {



                        let uploadData = this.getView().getModel('data').getData();

                        let uploadFlag = (uploadData.Company_Code === value.Company_Code && uploadData.fYear.getFullYear() == value.fiscal_year && uploadData.fPeriod == value.fiscal_period) ? true : false;

                        // setting the payload data

                        let aKeys = [];
                        aKeys = Object.keys(value);
                        let payload = {}
                        for (let j = 0; j < aKeys.length; j++) {
                            if (value[aKeys[j]] != "") {
                                payload[aKeys[j]] = value[aKeys[j]]
                            }
                        }

                        let payload1 = {
                            "Company_Code": value["Company_Code"],
                            "Plant": value["Plant"],
                            "Material": value["Material"],
                            "type": value["type"],
                            "flag": value["flag"],
                            "vendor": value["vendor"],
                            "plan_date": value["plan_date"],
                            "fiscal_year": value["fiscal_year"],
                            "fiscal_period": value["fiscal_period"],
                            "Period0": value["Period0"],
                            "Period1": value["Period1"],
                            "Period2": value["Period2"],
                            "Period3": value["Period3"],
                            "Period4": value["Period4"],
                            "Period5": value["Period5"],
                            "Period6": value["Period6"],
                            "Period7": value["Period7"],
                            "Period8": value["Period8"],
                            "Period9": value["Period9"],
                            "Period10": value["Period10"],
                            "Period11": value["Period11"],
                            "Period12": value["Period12"],
                            "Period13": value["Period13"],
                            "Period14": value["Period14"],
                            "Period15": value["Period15"],
                            "Period16": value["Period16"],
                            "Period17": value["Period17"],
                            "Period18": value["Period18"],
                            "Update_Reason": value["Update_Reason"]

                        };
                        // setting excel file row number for identifying the exact row in case of error or success
                        payload.ExcelRowNumber = (index + 1);
                        payload.isLast = '';
                        // calling the odata service

                        this.downloadFlag = false;

                        this.errorId = [];
                        if (this.excelSheetsData[0].length === index + 1) {
                            payload.isLast = 'X';
                        }
                        this.payload.push(payload);
                        if (uploadFlag) {
                            let createFlag = uploadData.create;
                            if (createFlag) {
                                                       
                                oModel.create("/ZZ_CV_00_PLNSPRMC", payload, {
                                    success: (result) => {

                                        //this.onSuccess.call(this,result, payload, fnResolve)

                                        console.log(result);
                                        this.currentCount += 1;
                                        let oMessageManager = sap.ui.getCore().getMessageManager();
                                        let oMessage = new sap.ui.core.message.Message({
                                            //message: "Building Created with ID: " + result.BuildingId,
                                            persistent: true, // create message as transition message
                                            type: sap.ui.core.MessageType.Success
                                        });
                                        oMessageManager.addMessages(oMessage);
                                        this.payload[this.currentCount - 1].Error = "";
                                        this.downloadData.push(this.payload[this.currentCount - 1]);

                                        if (this.rowCount === this.currentCount && this.downloadFlag) {
                                            this.onDownloadLog(this.downloadData);
                                        }

                                        fnResolve();

                                    },
                                    error: (error) => {
                                        // this.onError.call(this, error, payload, fnReject) 
                                        this.downloadFlag = true;
                                        this.currentCount += 1;
                                        console.log(error);
                                        console.log(JSON.parse(error.responseText).error.message.value);

                                        let errorArr = sap.ui.getCore().getMessageManager().getMessageModel().oData;
                                        this.payload[this.currentCount - 1].Error = "";
                                        for (let i = 0; i < errorArr.length; i++) {
                                            if (!this.errorId.includes(errorArr[i].id)) {
                                                this.errorId.push(errorArr[i].id);
                                                this.payload[this.currentCount - 1].Error = this.payload[this.currentCount - 1].Error + errorArr[i].message + ". ";
                                            }
                                        }
                                        this.downloadData.push(this.payload[this.currentCount - 1]);
                                        if (this.rowCount === this.currentCount && this.downloadFlag) {
                                            this.onDownloadLog(this.downloadData);
                                        }

                                        fnReject();
                                    }
                                });
                            } else {
                                let uUrl = "/ZZ_CV_00_PLNSPRMC(Company_Code='" + payload.Company_Code + "',Plant='" + payload.Plant + "',Material='" + payload.Material + "',type='" + payload.type + "',flag='" + payload.flag + "',vendor='" + payload.vendor + "',fiscal_year='" + payload.fiscal_year + "',fiscal_period='" + payload.fiscal_period + "')"
                                oModel.update(uUrl, payload, {
                                    success: (result) => {

                                        //this.onSuccess.call(this,result, payload, fnResolve)

                                        console.log(result);
                                        this.currentCount += 1;
                                        let oMessageManager = sap.ui.getCore().getMessageManager();
                                        let oMessage = new sap.ui.core.message.Message({
                                            //message: "Building Created with ID: " + result.BuildingId,
                                            persistent: true, // create message as transition message
                                            type: sap.ui.core.MessageType.Success
                                        });
                                        oMessageManager.addMessages(oMessage);
                                        this.payload[this.currentCount - 1].Error = "";
                                        this.downloadData.push(this.payload[this.currentCount - 1]);

                                        if (this.rowCount === this.currentCount && this.downloadFlag) {
                                            this.onDownloadLog(this.downloadData);
                                        }

                                        fnResolve();

                                    },
                                    error: (error) => {
                                        // this.onError.call(this, error, payload, fnReject) 
                                        this.downloadFlag = true;
                                        this.currentCount += 1;
                                        console.log(error);
                                        console.log(JSON.parse(error.responseText).error.message.value);

                                        let errorArr = sap.ui.getCore().getMessageManager().getMessageModel().oData;
                                        this.payload[this.currentCount - 1].Error = "";
                                        for (let i = 0; i < errorArr.length; i++) {
                                            if (!this.errorId.includes(errorArr[i].id)) {
                                                this.errorId.push(errorArr[i].id);
                                                this.payload[this.currentCount - 1].Error = this.payload[this.currentCount - 1].Error + errorArr[i].message + ". ";
                                            }
                                        }
                                        this.downloadData.push(this.payload[this.currentCount - 1]);
                                        if (this.rowCount === this.currentCount && this.downloadFlag) {
                                            this.onDownloadLog(this.downloadData);
                                        }

                                        fnReject();
                                    }
                                });
                            }
                        } else {
                            this.downloadFlag = true;
                            this.currentCount += 1;
                            this.payload[this.currentCount - 1].Error = "The Upload Screen Input doesnot matched the uploaded file data";
                            this.downloadData.push(this.payload[this.currentCount - 1]);
                            if (this.rowCount === this.currentCount && this.downloadFlag) {
                                this.onDownloadLog(this.downloadData);
                            }
                            fnReject();
                        }
                    } catch (error) {
                        console.log(error);
                        fnReject();
                    }

                });
            }


        };
    });