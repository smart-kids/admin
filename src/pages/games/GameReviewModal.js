import React from "react";
import "./Library.css";

const $ = window.$;

const MODAL_ID = "game_review_modal_" + Math.random().toString(36).substr(2, 9);

class GameReviewModal extends React.Component {
  
  componentDidMount() {
    $("#" + MODAL_ID).modal({
      show: true,
      backdrop: "static",
      keyboard: false
    });
  }

  componentWillUnmount() {
    $("#" + MODAL_ID).modal("hide");
  }

  handleClose = () => {
    $("#" + MODAL_ID).modal("hide");
    this.props.onClose();
  };

  render() {
    const { game } = this.props;

    if (!game || !game.gameUrl) {
      return (
        <div className="modal fade" id={MODAL_ID} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Game Preview</h5>
                <button type="button" className="close" onClick={this.handleClose}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body text-center">
                <p>No Game URL available.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="modal fade"
        id={MODAL_ID}
        tabIndex="-1"
        role="dialog"
        aria-labelledby="gameReviewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div className="modal-content border-0 shadow-lg" style={{borderRadius: '12px', height: '90vh'}}>
            
            <div className="modal-header bg-light border-bottom">
              <div className="d-flex align-items-center flex-grow-1">
                <i className="la la-gamepad text-primary mr-2" style={{fontSize: '1.5rem'}}></i>
                <div>
                  <h5 className="modal-title mb-0" id="gameReviewModalLabel">
                    {game.title}
                  </h5>
                  <small className="text-muted">by {game.developer || game.author}</small>
                </div>
              </div>
              <button type="button" className="close" onClick={this.handleClose}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="modal-body p-0" style={{height: 'calc(100% - 70px)', overflow: 'hidden'}}>
              <iframe
                src={game.gameUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '0 0 12px 12px'
                }}
                title="Game Viewer"
              />
            </div>

            <div className="modal-footer bg-light border-top">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={this.handleClose}
              >
                <i className="la la-times mr-1"></i>
                Close
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

export default GameReviewModal;
