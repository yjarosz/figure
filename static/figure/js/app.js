
$(function(){

    var figureModel = new FigureModel();

    // var figureFiles = new FileList();
    // figureFiles.fetch();

    // Backbone.unsaveSync = function(method, model, options, error) {
    //     figureModel.set("unsaved", true);
    // };

    // Override 'Backbone.sync'...
    Backbone.ajaxSync = Backbone.sync;

    Backbone.getSyncMethod = function(model) {
        if(model.syncOverride || (model.collection && model.collection.syncOverride))
        {
            return function(method, model, options, error) {
                figureModel.set("unsaved", true);
            };
        }
        return Backbone.ajaxSync;
    };

    // Override 'Backbone.sync' to default to localSync,
    // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
    Backbone.sync = function(method, model, options, error) {
        return Backbone.getSyncMethod(model).apply(this, [method, model, options, error]);
    };


    var view = new FigureView( {model: figureModel});   // uiState: uiState
    var svgView = new SvgView( {model: figureModel});
    new RightPanelView({model: figureModel});


    // Undo Model and View
    var undoManager = new UndoManager({'figureModel':figureModel}),
    undoView = new UndoView({model:undoManager});
    // Finally, start listening for changes to panels
    undoManager.listenToCollection(figureModel.panels);


    var FigureRouter = Backbone.Router.extend({

        routes: {
            "": "index",
            "new": "newFigure",
            "figure/:id": "loadFigure"
        },

        clearFigure: function() {

            $(".modal").modal('hide'); // hide any existing dialogs

            // Arrive at 'home' page, either starting here OR we hit 'new' figure...
            // ...so start by clearing any existing Figure (save first if needed)
            var self = this;
            if (figureModel.get("unsaved") && confirm("Save current Figure to OMERO?")) {
                figureModel.save_to_OMERO({}, function() {
                    figureModel.unset('fileId');
                });
            } else {
                figureModel.unset('fileId');
            }
            figureModel.delete_panels();
            figureModel.unset("figureName");

            figureModel.set(figureModel.defaults);
            // wait for undo/redo to handle above, then...
            setTimeout(function() {
                figureModel.trigger("reset_undo_redo");
            }, 50);

            return false;
        },

        index: function() {
            this.clearFigure();
            figureModel.set('unsaved', false);
            $('#welcomeModal').modal();
        },

        newFigure: function() {
            this.clearFigure();
            figureModel.set('unsaved', false);
            $('#addImagesModal').modal();
        },

        loadFigure: function(id) {
            this.clearFigure();

            var fileId = parseInt(id, 10);
            figureModel.load_from_OMERO(fileId);
        }
    });

    app = new FigureRouter();
    Backbone.history.start();

});
