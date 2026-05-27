import React from "react";
import Data from "../../utils/data";
import GameModal from "./add";
import GameReviewModal from "./GameReviewModal";
import "./Library.css";

const NO_COVER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200"><rect width="100%" height="100%" fill="%23f3f4f6" rx="8"/><rect x="8" y="8" width="134" height="184" fill="none" stroke="%23e5e7eb" stroke-width="2" stroke-dasharray="4" rx="6"/><path d="M55 75h40v6H55zm0 14h40v6H55zm0 14h25v6H55z" fill="%239ca3af"/><text x="75" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="%239ca3af" text-anchor="middle">No Cover</text></svg>`;

class GamesList extends React.Component {
  state = {
    games: [],
    filteredGames: [],
    searchTerm: "",
    activeCategory: "All",
    loading: true,
    reviewGame: null,
    showReviewModal: false,
  };

  componentDidMount() {
    this._subscription = Data.games.subscribe(({ games }) => {
      this.setState({ games: games || [], loading: false }, this.filterGames);
    });
  }

  componentWillUnmount() {
    if (this._subscription) this._subscription();
  }

  filterGames = () => {
    const { games, searchTerm, activeCategory } = this.state;
    let filtered = games || [];

    if (activeCategory !== "All") {
      filtered = filtered.filter((g) => g.category === activeCategory);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          (g.title || "").toLowerCase().includes(lower) ||
          (g.developer || "").toLowerCase().includes(lower)
      );
    }

    this.setState({ filteredGames: filtered });
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value }, this.filterGames);
  };

  handleCategoryChange = (category) => {
    this.setState({ activeCategory: category }, this.filterGames);
  };

  openAddModal = () => {
    if (this.modalRef) {
      this.modalRef.show(); 
    }
  };

  openEditModal = (game) => {
    if (this.modalRef) {
      this.modalRef.show(game); 
    }
  };

  handleSaveGame = (gameData) => {
    if (gameData.id) {
      Data.games.update(gameData)
        .then(() => window.toastr.success("Game updated successfully"))
        .catch((err) => {
          console.error(err);
          window.toastr.error("Failed to update game");
        });
    } else {
      const { id, ...newGame } = gameData;
      Data.games.create(newGame)
        .then(() => window.toastr.success("Game added successfully"))
        .catch((err) => {
          console.error(err);
          window.toastr.error("Failed to add game");
        });
    }
  };

  openReviewMode = (game) => {
    this.setState({ reviewGame: game, showReviewModal: true });
  };

  closeReviewMode = () => {
    this.setState({ reviewGame: null, showReviewModal: false });
  };

  deleteGame = (game) => {
    if (window.confirm(`Are you sure you want to delete "${game.title}"?`)) {
      Data.games.delete(game)
        .then(() => window.toastr.success("Game deleted"))
        .catch((err) => {
          console.error(err);
          window.toastr.error("Failed to delete game");
        });
    }
  };

  renderGameCard = (game) => (
    <div key={game.id} className="book-card">
      <div className="book-cover-wrapper">
        <img
          src={game.coverUrl || NO_COVER_SVG}
          alt={game.title}
          className="book-cover-img"
          onError={(e) => { e.target.onerror = null; e.target.src=NO_COVER_SVG; }} 
        />
        
        <div className="book-quick-view-overlay">
            <button 
                className="quick-view-btn"
                onClick={() => this.openReviewMode(game)}
                title="Play Game"
            >
                <i className="la la-play"></i>
            </button>
        </div>
      </div>
      
      <div className="book-info">
        <div className="book-title" title={game.title}>
          {game.title}
        </div>
        <div className="book-author">{game.developer}</div>
      </div>
      
      <div className="book-actions">
        <button 
            className="book-action-btn edit-btn"
            onClick={() => this.openEditModal(game)}
            title="Edit Game"
        >
            <i className="la la-edit"></i>
        </button>
        
        {game.gameUrl && (
            <button 
                className="book-action-btn view-btn"
                onClick={() => this.openReviewMode(game)}
                title="Play Game"
            >
                <i className="la la-gamepad"></i>
            </button>
        )}
        
        <button 
            className="book-action-btn delete-btn"
            onClick={() => this.deleteGame(game)}
            title="Delete Game"
        >
            <i className="la la-trash"></i>
        </button>
      </div>
    </div>
  );

  render() {
    const { filteredGames, activeCategory, loading } = this.state;
    const categories = ["All", "Action", "Adventure", "Puzzle", "Educational", "RPG", "Other"];

    if (loading) {
        return <div className="library-container text-center pt-5">Loading Games...</div>;
    }

    return (
      <div className="library-container">
        <div className="library-header">
          <div>
            <h2 className="lib-title">Games Center</h2>
            <p className="lib-subtitle">Manage interactive itch.io games</p>
          </div>
          
          <button
            className="btn-apple-add"
            onClick={this.openAddModal}
          >
            <i className="la la-plus" /> Add Game
          </button>
        </div>

        <div className="library-controls">
            <div className="category-pills">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => this.handleCategoryChange(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="search-wrapper">
                <i className="la la-search search-icon"></i>
                <input
                    type="text"
                    className="apple-search"
                    placeholder="Search Title or Developer..."
                    onChange={this.handleSearch}
                />
            </div>
        </div>

        <div className="book-shelf">
            {filteredGames.map(this.renderGameCard)}
        </div>

        {filteredGames.length === 0 && (
            <div className="empty-state" style={{textAlign: 'center', padding: '4rem', color: '#999'}}>
                <i className="la la-gamepad" style={{fontSize: '3rem', marginBottom: '1rem', display: 'block'}}></i>
                <p>No games found for this category or search.</p>
            </div>
        )}

        <GameModal 
            ref={ref => this.modalRef = ref}
            onSave={this.handleSaveGame}
        />
        
        {this.state.showReviewModal && this.state.reviewGame && (
            <GameReviewModal 
                game={this.state.reviewGame}
                onClose={this.closeReviewMode}
            />
        )}
      </div>
    );
  }
}

export default GamesList;