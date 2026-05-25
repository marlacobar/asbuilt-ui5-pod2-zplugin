sap.ui.define([
    'jquery.sap.global',
    "sap/m/library",
    "sap/ui/core/Fragment",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/dm/dme/pod2/context/PodContext",
    "sap/dm/dme/pod2/context/ModelPath",
    "sap/dm/dme/pod2/api/RestClient",
    "sap/dm/dme/pod2/api/ApiPaths",
    "sap/dm/dme/pod2/widget/core/TableWidget",
    "mhp/pod2/zplugins/asbuiltreportplugin/controller/utils/Commons",
    "mhp/pod2/zplugins/asbuiltreportplugin/model/formatter",
], function (
    jQuery,
    MobileLibrary,
    Fragment,
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

    return Controller.extend("mhp.pod2.zplugins.asbuiltreportplugin.controller.ActualComponents", {
        Commons: Commons,
        formatter: formatter,

        onInit: function () { },

        onCloseSecondColumn: function (oEvent) {
            const oView = this.getView(),
                oFCL = oView.getParent().getParent(),
                oTable = oView.byId("idActualComponentTable"),
                oBinding = oTable.getBinding("items");

            // Clear filters
            oBinding.filter([]);

            oFCL.setLayout("OneColumn");
        },

        onOpenDataFieldsPopover: async function (oEvent) {
            const oView = this.getView(),
                oLink = oEvent.getSource(),
                oSelectedCxt = oLink.getBindingContext("AsBuilt"),
                oCtxObject = oSelectedCxt.getObject();

            if (!this._oDataFieldsPopover) {
                Fragment.load({
                    id: "idDataFieldsPopover",
                    name: "mhp.pod2.zplugins.asbuiltreportplugin.view.fragments.DataFieldsPopover",
                    controller: this
                }).then(function (oPopover) {
                    this._oDataFieldsPopover = oPopover;
                    oView.addDependent(this._oDataFieldsPopover);

                    this._oDataFieldsPopover.setBindingContext(oSelectedCxt, "AsBuilt");
                    this._oDataFieldsPopover.openBy(oLink);
                }.bind(this));
            } else {
                this._oDataFieldsPopover.setBindingContext(oSelectedCxt, "AsBuilt");
                this._oDataFieldsPopover.openBy(oLink);
            }
        },

    });
});
