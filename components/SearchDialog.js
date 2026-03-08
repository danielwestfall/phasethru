import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    TextField, Button, CircularProgress, List, ListItem, 
    ListItemAvatar, Avatar, ListItemText, Typography 
} from "@material-ui/core";

const SearchDialog = ({ 
    open, 
    onClose, 
    searchQuery, 
    setSearchQuery, 
    isSearching, 
    searchResults, 
    onSearch, 
    onSelectResult 
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Search YouTube for Videos</DialogTitle>
            <DialogContent dividers>
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                    <TextField
                        autoFocus
                        placeholder="Search keywords..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                        style={{ marginRight: '15px' }}
                        inputProps={{ 'aria-label': 'Search YouTube keywords' }}
                    />
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={onSearch}
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                    </Button>
                </div>

                <List>
                    {searchResults.map((result) => (
                        <ListItem button key={result.id} onClick={() => onSelectResult(result)}>
                            <ListItemAvatar>
                                <Avatar variant="square" src={result.thumbnail} style={{ width: 120, height: 68, marginRight: 15 }} />
                            </ListItemAvatar>
                            <ListItemText 
                                primary={result.title} 
                                secondary={`${result.channel} • ${result.views} views • ${result.duration}`} 
                            />
                        </ListItem>
                    ))}
                    {searchResults.length === 0 && !isSearching && searchQuery && (
                        <Typography color="textSecondary" align="center">No results found.</Typography>
                    )}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SearchDialog;
