// Generated by CoffeeScript 1.6.3
(function() {
  window.Recording = (function() {
    function Recording() {
      if (!navigator.getUserMedia) {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      }
      this.sampleRate = 44100;
      this.setNastyGlobals();
      if (navigator.getUserMedia) {
        navigator.getUserMedia({
          audio: true
        }, this.sample, this.failure);
      } else {
        alert("Your browser doesn't support WebAudio or WebRTC. Upgrade to the latest Chrome or Firefox.");
      }
    }

    Recording.prototype.setNastyGlobals = function() {
      window.__recording = false;
      window.__leftchannel = [];
      window.__rightchannel = [];
      window.__recordingLength = 0;
      return null;
    };

    Recording.prototype.sample = function(current_stream) {
      var AudioCtx, audioInput, bufferSize, context, recorder, volume;
      AudioCtx = window.AudioContext || window.webkitAudioContext;
      context = new AudioCtx();
      volume = context.createGain();
      audioInput = context.createMediaStreamSource(current_stream);
      audioInput.connect(volume);
      /* From the spec: This value controls how frequently the audioprocess event is 
          dispatched and how many sample-frames need to be processed each call. 
          Lower values for buffer size will result in a lower (better) latency. 
          Higher values will be necessary to avoid audio breakup and glitches
      */

      bufferSize = 1024;
      recorder = context.createJavaScriptNode(bufferSize, 2, 2);
      recorder.onaudioprocess = function(current_stream) {
        var left, right;
        if (!window.__recording) {
          return;
        }
        left = current_stream.inputBuffer.getChannelData(0);
        right = current_stream.inputBuffer.getChannelData(1);
        window.__leftchannel.push(new Float32Array(left));
        window.__rightchannel.push(new Float32Array(right));
        return window.__recordingLength += bufferSize;
      };
      volume.connect(recorder);
      return recorder.connect(context.destination);
    };

    Recording.prototype.start = function() {
      window.__recording = true;
      window.__leftchannel.length = window.__rightchannel.length = 0;
      window.__recordingLength = 0;
      return console.log("Recording now...");
    };

    Recording.prototype.stop = function() {
      var buffer, i, index, interleaved, leftBuffer, lng, recording, rightBuffer, view, volume;
      recording = false;
      leftBuffer = this._mergeBuffers(window.__leftchannel, window.__recordingLength);
      rightBuffer = this._mergeBuffers(window.__rightchannel, window.__recordingLength);
      interleaved = this._interleave(leftBuffer, rightBuffer);
      buffer = new ArrayBuffer(44 + interleaved.length * 2);
      view = new DataView(buffer);
      this._writeUTFBytes(view, 0, "RIFF");
      view.setUint32(4, 44 + interleaved.length * 2, true);
      this._writeUTFBytes(view, 8, "WAVE");
      this._writeUTFBytes(view, 12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 2, true);
      view.setUint32(24, window.__sampleRate, true);
      view.setUint32(28, window.__sampleRate * 4, true);
      view.setUint16(32, 4, true);
      view.setUint16(34, 16, true);
      this._writeUTFBytes(view, 36, "data");
      view.setUint32(40, interleaved.length * 2, true);
      lng = interleaved.length;
      index = 44;
      volume = 1;
      i = 0;
      while (i < lng) {
        view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
        index += 2;
        i++;
      }
      this.blob = new Blob([view], {
        type: "audio/wav"
      });
      this.url = (window.URL || window.webkitURL).createObjectURL(this.blob);
      return this.setNastyGlobals();
    };

    Recording.prototype.download = function(fileName) {
      var click, link;
      if (fileName == null) {
        fileName = 'output.wav';
      }
      link = window.document.createElement("a");
      link.href = this.url;
      link.download = fileName;
      click = document.createEvent("Event");
      click.initEvent("click", true, true);
      return link.dispatchEvent(click);
    };

    Recording.prototype._interleave = function(leftChannel, rightChannel) {
      var index, inputIndex, length, result;
      length = leftChannel.length + rightChannel.length;
      result = new Float32Array(length);
      inputIndex = 0;
      index = 0;
      while (index < length) {
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
      }
      return result;
    };

    Recording.prototype._mergeBuffers = function(channelBuffer, recordingLength) {
      var buffer, i, lng, offset, result;
      result = new Float32Array(recordingLength);
      offset = 0;
      lng = channelBuffer.length;
      i = 0;
      while (i < lng) {
        buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
        i++;
      }
      return result;
    };

    Recording.prototype._writeUTFBytes = function(view, offset, string) {
      var i, lng, _results;
      lng = string.length;
      i = 0;
      _results = [];
      while (i < lng) {
        view.setUint8(offset + i, string.charCodeAt(i));
        _results.push(i++);
      }
      return _results;
    };

    return Recording;

  })();

}).call(this);

/*
//@ sourceMappingURL=recorder.map
*/