import React from "react";

class VideoPlayerModal extends React.Component {
  componentDidMount() {
    // Dynamically initialize Plyr when loaded
    if (window.Plyr) {
      this.player = new window.Plyr(this.videoRef, {
        controls: [
          'play-large', 'play', 'progress', 'current-time',
          'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        tooltips: { controls: true, seek: true }
      });
    }
  }

  componentWillUnmount() {
    if (this.player) {
      try {
        this.player.destroy();
      } catch (e) {
        console.error("Plyr cleanup error:", e);
      }
    }
  }

  render() {
    const { book, onClose } = this.props;
    if (!book) return null;

    return (
      <div className="video-player-modal-backdrop" onClick={onClose}>
        <div className="video-player-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="video-player-modal-header">
            <h5 className="video-player-title">
              <i className="la la-video-camera mr-2 text-primary"></i>
              {book.title}
            </h5>
            <button className="video-player-close-btn" onClick={onClose}>
              <i className="la la-times"></i>
            </button>
          </div>
          
          <div className="video-player-body">
            <video 
              ref={ref => this.videoRef = ref}
              src={book.videoUrl}
              playsInline
              controls
              className="plyr-video-player"
            />
          </div>
          
          <div className="video-player-footer">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge badge-primary px-3 py-2 font-weight-bold" style={{ borderRadius: '20px' }}>
                {book.category || "General"}
              </span>
              <span className="video-player-author font-weight-bold text-muted">
                Instructor: {book.author || "Unknown"}
              </span>
            </div>
            <p className="video-player-desc mt-2">
              {book.description || "No description provided for this video lesson."}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default VideoPlayerModal;
