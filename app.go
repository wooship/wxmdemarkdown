package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx            context.Context
	pendingFile    string
	currentContent string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// onFileOpen is called when the app is opened with a file
func (a *App) onFileOpen(filePath string) {
	a.pendingFile = filePath
	if a.ctx != nil {
		content, err := os.ReadFile(filePath)
		if err != nil {
			// Handle error or log it
			return
		}
		runtime.EventsEmit(a.ctx, "file-opened", string(content))
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// OpenFile prompts the user to select a markdown file and returns its content
func (a *App) OpenFile() (string, error) {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Markdown File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown Files (*.md)",
				Pattern:     "*.md",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})

	if err != nil {
		return "", err
	}

	if selection == "" {
		return "", nil // User cancelled
	}

	content, err := os.ReadFile(selection)
	if err != nil {
		return "", err
	}

	return string(content), nil
}

// SaveFile prompts the user to save the markdown content to a file
func (a *App) SaveFile(content string) (string, error) {
	selection, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Markdown File",
		DefaultFilename: "untitled.md",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown Files (*.md)",
				Pattern:     "*.md",
			},
		},
	})

	if err != nil {
		return "", err
	}

	if selection == "" {
		return "", nil // User cancelled
	}

	err = os.WriteFile(selection, []byte(content), 0644)
	if err != nil {
		return "", err
	}

	return selection, nil
}

// CheckForFile returns the content of the file that triggered the app launch, if any.
func (a *App) CheckForFile() (string, error) {
	if a.pendingFile != "" {
		content, err := os.ReadFile(a.pendingFile)
		if err != nil {
			return "", err
		}
		// Clear pending file after reading
		a.pendingFile = ""
		return string(content), nil
	}
	return "", nil
}

// SaveLastContent saves the markdown content to a local file
func (a *App) SaveLastContent(content string) error {
	filePath, err := a.getLastContentPath()
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, []byte(content), 0644)
}

// LoadLastContent loads the last saved markdown content
func (a *App) LoadLastContent() (string, error) {
	filePath, err := a.getLastContentPath()
	if err != nil {
		return "", err
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil // No saved content yet
		}
		return "", err
	}

	return string(content), nil
}

// getLastContentPath returns the path to the last content file
func (a *App) getLastContentPath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	appDataDir := filepath.Join(homeDir, ".wxmdemarkdown")

	// Create directory if it doesn't exist
	if err := os.MkdirAll(appDataDir, 0755); err != nil {
		return "", err
	}

	return filepath.Join(appDataDir, "last_content.md"), nil
}

// SetCurrentContent updates the current markdown content (for auto-save on close)
func (a *App) SetCurrentContent(content string) {
	a.currentContent = content
}

// SaveCurrentContent saves the current content to file
func (a *App) SaveCurrentContent() error {
	return a.SaveLastContent(a.currentContent)
}
