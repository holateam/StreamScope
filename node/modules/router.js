function Router() {
}

module.exports=Router;

Router.prototype.sendResponse = function (res, code, data) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    if (typeof data=="string") {
        res.statusMessage = data;
        res.status(code).json({code: code, error: data});
    } else {
        res.status(code).json({code: code, response: data});
    }
    res.end();
    console.log("send response", code, data)
};

Router.prototype.formDataObject = function (streamName){
    return {
        data: {
            streamUrl: config.streamUrl,
            streamName: streamName
        }
    };
};

Router.prototype.formErrorObject = function () {
    return {
        error: {
            code: " ",
            message: " "
        }
    };
};

Router.prototype.publishRequest = function (req, res) {
    if (rejecter.publishAllowed()){
        var streamName = nameGenerator.generateName();
        streamStorage.addStream(streamName);
        this.sendResponse(res, 200, formDataObject(streamName));
    } else {
        this.sendResponse(res, 400, formErrorObject());
    }
};

Router.prototype.playRequest = function (req, res) {
    var shortStreamName = req.query.id;
    if (rejecter.streamAllowed(shortStreamName)){
        var previewMode = false;
        if (req.query.preview == "true"){
            previewMode = true;
        }
        var streamName = nameGenerator.generateName(shortStreamName);
        streamStorage.addStream(streamName);
        this.sendResponse(res, 200, formDataObject(streamName));
    } else {
        this.sendResponse(res, 400, formErrorObject());
    }
};

Router.prototype.getStreams = function (req, res) {
    var streamsList = streamStorage.getActiveStreams();
    this.sendResponse(res, 200, {data: streamsList});
};
