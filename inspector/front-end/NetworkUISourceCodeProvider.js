/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @param {WebInspector.Workspace} workspace
 */
WebInspector.NetworkUISourceCodeProvider = function(workspace)
{
    this._workspace = workspace;
    WebInspector.resourceTreeModel.addEventListener(WebInspector.ResourceTreeModel.EventTypes.ResourceAdded, this._resourceAdded, this);
    this._workspace.addEventListener(WebInspector.Workspace.Events.ProjectWillReset, this._projectWillReset, this);
    this._workspace.addEventListener(WebInspector.Workspace.Events.ProjectDidReset, this._projectDidReset, this);
    WebInspector.debuggerModel.addEventListener(WebInspector.DebuggerModel.Events.ParsedScriptSource, this._parsedScriptSource, this);

    this._uiSourceCodeForResource = {};
    this._lastDynamicAnonymousScriptIndexForURL = {};
}

WebInspector.NetworkUISourceCodeProvider.prototype = {
    _populate: function()
    {
        function populateFrame(frame)
        {
            for (var i = 0; i < frame.childFrames.length; ++i)
                populateFrame.call(this, frame.childFrames[i]);

            var resources = frame.resources();
            for (var i = 0; i < resources.length; ++i)
                this._resourceAdded({data:resources[i]});
        }

        populateFrame.call(this, WebInspector.resourceTreeModel.mainFrame);
    },

    /**
     * @param {WebInspector.Event} event
     */
    _parsedScriptSource: function(event)
    {
        var script = /** @type {WebInspector.Script} */ event.data;
        if (!script.sourceURL || script.isInlineScript())
            return;
        var isDynamicAnonymousScript;
        // Only add uiSourceCodes for
        // - content scripts;
        // - scripts with explicit sourceURL comment;
        // - dynamic anonymous scripts (script elements without src attribute);
        // - dynamic scripts (script elements with src attribute) when inspector is opened after the script was loaded.
        if (!script.hasSourceURL && !script.isContentScript) {
            var resource = WebInspector.resourceForURL(script.sourceURL);
            if (resource && resource.contentType() === WebInspector.resourceTypes.Document)
                isDynamicAnonymousScript = true;
            else if (resource || WebInspector.networkLog.requestForURL(script.sourceURL))
                return;
        }
        // Filter out embedder injected content scripts.
        if (script.isContentScript && !script.hasSourceURL) {
            var parsedURL = new WebInspector.ParsedURL(script.sourceURL);
            if (!parsedURL.host)
                return;
        }
        if (this._uiSourceCodeForResource[script.sourceURL] && !isDynamicAnonymousScript)
            return;
        var url = script.sourceURL;
        if (isDynamicAnonymousScript) {
            var dynamicAnonymousScriptIndex = (this._lastDynamicAnonymousScriptIndexForURL[url] || 0) + 1;
            this._lastDynamicAnonymousScriptIndexForURL[url] = dynamicAnonymousScriptIndex;
            url += " (" + dynamicAnonymousScriptIndex + ")";
        }
        var uiSourceCode = new WebInspector.UISourceCode(url, script, true);
        this._uiSourceCodeForResource[script.sourceURL] = uiSourceCode;
        this._workspace.project().addUISourceCode(uiSourceCode);
    },

    /**
     * @param {WebInspector.Event} event
     */
    _resourceAdded: function(event)
    {
        var resource = /** @type {WebInspector.Resource} */ event.data;
        if (this._uiSourceCodeForResource[resource.url])
            return;
        var uiSourceCode;
        switch (resource.type) {
        case WebInspector.resourceTypes.Stylesheet:
            uiSourceCode = new WebInspector.UISourceCode(resource.url, resource, true);
            break;
        case WebInspector.resourceTypes.Document:
            uiSourceCode = new WebInspector.UISourceCode(resource.url, resource, false);
            break;
        case WebInspector.resourceTypes.Script:
            uiSourceCode = new WebInspector.UISourceCode(resource.url, resource, true);
            break;
        }
        if (uiSourceCode) {
            this._uiSourceCodeForResource[resource.url] = uiSourceCode;
            this._workspace.project().addUISourceCode(uiSourceCode);
        }
    },

    _projectWillReset: function()
    {
        this._uiSourceCodeForResource = {};
        this._lastDynamicAnonymousScriptIndexForURL = {};
    },

    _projectDidReset: function()
    {
        this._populate();
    }
}
