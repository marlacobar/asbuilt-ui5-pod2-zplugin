sap.ui.define([
    "sap/m/library",
    "sap/m/MessageBox",
    "sap/ui/core/library",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/model/json/JSONModel",
    "sap/dm/dme/pod2/widget/Widget",
    "sap/dm/dme/pod2/model/I18nResourceModel",
    "sap/dm/dme/pod2/widget/metadata/WidgetProperty",
    "sap/dm/dme/pod2/propertyeditor/BooleanPropertyEditor",
], (
    SapMLibrary,
    MessageBox,
    SapUiCoreLibrary,
    XMLView,
    JSONModel,
    Widget,
    I18nResourceModel,
    WidgetProperty,
    BooleanPropertyEditor,
) => {

    "use strict";

    class asbuiltreportplugin extends Widget {

        static #oI18nModel = new I18nResourceModel({
            bundleName: "mhp.pod2.zplugins.asbuiltreportplugin.i18n.i18n"
        });

        static getI18nModel() {
            return this.#oI18nModel;
        }

        static getDisplayName() {
            return this.getI18nText("displayName");
        }

        static getIcon() {
            return "sap-icon://verified";
        }

        static getCategory() {
            return this.getI18nText("category");
        }

        static getDescription() {
            return this.getI18nText("description");
        }

        _createView() {
            const oConfig = this.getConfig();

            return XMLView.create({
                id: oConfig.id,
                viewName: "mhp.pod2.zplugins.asbuiltreportplugin.view.MainView"
            });
        } 

        getProperties() {

            const aProperties = [];
            aProperties.push(
                new WidgetProperty({
                    displayName: this.getI18nText("booleanProperty.displayName"),
                    description: this.getI18nText("booleanProperty.description"),
                    category: this.getI18nText("booleanProperty.category"),
                    propertyEditor: new BooleanPropertyEditor(this,
                        "SampleBoolean", true)
                })
            );

            return aProperties;
        }
    }

    return asbuiltreportplugin;
});