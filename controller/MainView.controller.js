sap.ui.define([
    'jquery.sap.global',
    "sap/m/library",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/dm/dme/pod2/context/PodContext",
    "sap/dm/dme/pod2/context/ModelPath",
    "sap/dm/dme/pod2/api/RestClient",
    "sap/dm/dme/pod2/api/ApiPaths",
    "sap/dm/dme/pod2/widget/core/TableWidget",
    "mhp/pod2/zplugins/asbuiltreportplugin/controller/utils/Commons",
    "mhp/pod2/zplugins/asbuiltreportplugin/model/formatter"
], function (
    jQuery,
    MobileLibrary,
    Controller,
    JSONModel,
    PodContext,
    ModelPath,
    RestClient,
    ApiPaths,
    TableWidget,
    Commons,
    formatter
) {
    "use strict";

    const { MessageBox, MessageToast } = MobileLibrary;

    return Controller.extend("mhp.pod2.zplugins.asbuiltreportplugin.controller.MainView", {
        Commons: Commons,
        formatter: formatter,

        onInit: function () {
            const oView = this.getView();
            const oResourceModel = new sap.ui.model.resource.ResourceModel({ bundleName: "mhp.pod2.zplugins.asbuiltreportplugin.i18n.i18n" });
            oView.setModel(oResourceModel, "i18n");

            // this.oFilterBar = oView.byId("filterBar");
            // const oFilters = PodContext.getFilters();

            const sPlant = PodContext.getPlant(),
                sPlantTimeZone = PodContext.getPlantTimeZone();
            let oViewModel = new JSONModel({
                busy: false,
                plant: sPlant,
                plantTimeZone: sPlantTimeZone
                // filters: oFilters
            });
            oView.setModel(oViewModel, "viewModel");
            oView.setModel(new JSONModel(), "AsBuilt");
            // this._getFilters();
        },

        onAfterRendering: function () { },

        onExit: function () { },

        onSearch: async function () {
            const oView = this.getView(),
                oViewModel = oView.getModel("viewModel"),
                oViewModelData = oViewModel.getData(),
                oBundle = oView.getModel("i18n").getResourceBundle();

            const sSfc = this.byId("idSfcInput").getValue(),
                sSfcFILabel = this.byId("idSfcFI").getLabel() ?? 'SFC',
                sComponentState = this.byId("idComponentStateSelect").getSelectedKey(),
                sFindComponent = this.byId("idFindComponentInput").getValue();

            if (!sSfc) {
                MessageBox.error(oBundle.getText("errMessage.mandatoryField", [sSfcFILabel]));
                return;
            }

            // Set one column layout
            const oFCL = oView.byId("fcl").setLayout("OneColumn");

            // Initialize ProgressIndicator Model
            oView.getModel("AsBuilt").setProperty("/progress", {
                percent: 0,
                display: `0%`
            });

            oViewModel.setProperty("/busy", true);
            oView.setModel(new JSONModel(), "AsBuilt");

            let oParams = {
                IN_PLANT: oViewModelData.plant,
                IN_SFC: sSfc,
                IN_COMPONENT_STATE: sComponentState,
                IN_COMPONENT: sFindComponent
            };

            const oBomComponents = await this.Commons.getSfcDetail(oParams);
            
            oViewModel.setProperty("/loadingAsBuilt", true);
            oViewModel.setProperty("/busy", false);            


            // ===========================================================================
            // Async search for assembled components
            const oAssyParams = {
                plant: oViewModelData.plant,
                sfc: sSfc,
                componentState: sComponentState
            };

            this.Commons.getAssembledComponents(oAssyParams, oBomComponents, oView.getModel("AsBuilt"))
                .then((oData) => {
                    oViewModel.setProperty("/loadingAsBuilt", false);
                })
                .catch((oError) => {
                    MessageToast.show(oError.message);
                });
        },

    });
});
