/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef RTCDataChannel_h
#define RTCDataChannel_h

#if ENABLE(MEDIA_STREAM)

#include "ActiveDOMObject.h"
#include "EventTarget.h"
#include "RTCDataChannelDescriptor.h"
#include <wtf/RefCounted.h>

namespace WebCore {
class Blob;
class RTCPeerConnectionHandler;

class RTCDataChannel : public RefCounted<RTCDataChannel>, public EventTarget, public RTCDataChannelDescriptorClient {
public:
    static PassRefPtr<RTCDataChannel> create(ScriptExecutionContext*, RTCPeerConnectionHandler*, const String& label, bool reliable, ExceptionCode&);
    static PassRefPtr<RTCDataChannel> create(ScriptExecutionContext*, RTCPeerConnectionHandler*, PassRefPtr<RTCDataChannelDescriptor>);
    ~RTCDataChannel();

    String label() const;

    bool reliable() const;

    String readyState() const;

    unsigned long bufferedAmount() const;

    String binaryType() const;
    void setBinaryType(const String&, ExceptionCode&);

    void send(const String&, ExceptionCode&);
    void send(PassRefPtr<ArrayBuffer>, ExceptionCode&);
    void send(PassRefPtr<ArrayBufferView>, ExceptionCode&);
    void send(PassRefPtr<Blob>, ExceptionCode&);

    void close();

    DEFINE_ATTRIBUTE_EVENT_LISTENER(open);
    DEFINE_ATTRIBUTE_EVENT_LISTENER(error);
    DEFINE_ATTRIBUTE_EVENT_LISTENER(close);
    DEFINE_ATTRIBUTE_EVENT_LISTENER(message);

    RTCDataChannelDescriptor* descriptor();
    void stop();

    // EventTarget
    virtual const AtomicString& interfaceName() const OVERRIDE;
    virtual ScriptExecutionContext* scriptExecutionContext() const OVERRIDE;

    using RefCounted<RTCDataChannel>::ref;
    using RefCounted<RTCDataChannel>::deref;

private:
    RTCDataChannel(ScriptExecutionContext*, RTCPeerConnectionHandler*, PassRefPtr<RTCDataChannelDescriptor>);

    // EventTarget
    virtual EventTargetData* eventTargetData();
    virtual EventTargetData* ensureEventTargetData();
    virtual void refEventTarget() { ref(); }
    virtual void derefEventTarget() { deref(); }
    EventTargetData m_eventTargetData;
    ScriptExecutionContext* m_scriptExecutionContext;

    // RTCDataChannelDescriptor::Owner
    virtual void readyStateChanged() OVERRIDE;
    virtual void dataArrived(const String&) OVERRIDE;
    virtual void dataArrived(const char*, size_t) OVERRIDE;
    virtual void error() OVERRIDE;

    bool m_stopped;
    RefPtr<RTCDataChannelDescriptor> m_descriptor;

    enum BinaryType {
        BinaryTypeBlob,
        BinaryTypeArrayBuffer
    };
    BinaryType m_binaryType;

    // Not owned by this class.
    RTCPeerConnectionHandler* m_handler;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)

#endif // RTCDataChannel_h
