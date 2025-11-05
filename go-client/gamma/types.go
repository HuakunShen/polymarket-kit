package gamma

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"time"
)

// ProxyConfig represents HTTP/HTTPS proxy configuration
type ProxyConfig struct {
	Host     string  `json:"host"`                // Proxy server hostname or IP address
	Port     int     `json:"port"`                // Proxy server port number
	Username *string `json:"username,omitempty"`  // Proxy authentication username
	Password *string `json:"password,omitempty"`  // Proxy authentication password
	Protocol *string `json:"protocol,omitempty"`  // Proxy protocol (http or https)
}

// Team represents a sports team
type Team struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	League       string    `json:"league"`
	Record       *string   `json:"record,omitempty"`
	Logo         string    `json:"logo"`
	Abbreviation string    `json:"abbreviation"`
	Alias        *string   `json:"alias,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// TeamQuery represents query parameters for teams
type TeamQuery struct {
	Limit     *int    `json:"limit,omitempty"`
	Offset    *int    `json:"offset,omitempty"`
	Order     *string `json:"order,omitempty"`
	Ascending *bool   `json:"ascending,omitempty"`
	League    *string `json:"league,omitempty"`
}

// Tag represents a tag/categorization
type Tag struct {
	ID        string    `json:"id"`
	Label     string    `json:"label"`
	Slug      string    `json:"slug"`
	ForceShow *bool     `json:"forceShow,omitempty"`
	CreatedAt *string   `json:"createdAt,omitempty"`
	IsCarousel *bool    `json:"isCarousel,omitempty"`
}

// UpdatedTag represents an updated tag with more fields
type UpdatedTag struct {
	ID          string     `json:"id"`
	Label       string     `json:"label"`
	Slug        string     `json:"slug"`
	ForceShow   *bool      `json:"forceShow,omitempty"`
	PublishedAt *string    `json:"publishedAt,omitempty"`
	CreatedBy   *int       `json:"createdBy,omitempty"`
	UpdatedBy   *int       `json:"updatedBy,omitempty"`
	CreatedAt   string     `json:"createdAt"`
	UpdatedAt   string     `json:"updatedAt"`
	ForceHide   *bool      `json:"forceHide,omitempty"`
	IsCarousel  *bool      `json:"isCarousel,omitempty"`
}

// TagQuery represents query parameters for tags
type TagQuery struct {
	Limit      *int   `json:"limit,omitempty"`
	Offset     *int   `json:"offset,omitempty"`
	Order      *string `json:"order,omitempty"`
	Ascending  *bool  `json:"ascending,omitempty"`
	Search     *string `json:"search,omitempty"`
	IsCarousel *bool  `json:"is_carousel,omitempty"`
}

// TagByIdQuery represents query parameters for getting tag by ID
type TagByIdQuery struct {
	IncludeTemplate *bool `json:"include_template,omitempty"`
}

// RelatedTagRelationship represents relationships between tags
type RelatedTagRelationship struct {
	SourceTagID      int              `json:"sourceTagId"`
	TargetTagID      int              `json:"targetTagId"`
	RelationshipType string           `json:"relationshipType"`
	TargetTag        UpdatedTag       `json:"targetTag"`
	Relationship     TagRelationship  `json:"relationship"`
}

// TagRelationship represents relationship metadata
type TagRelationship struct {
	ID        int       `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// RelatedTagsQuery represents query parameters for related tags
type RelatedTagsQuery struct {
	Limit     *int    `json:"limit,omitempty"`
	Offset    *int    `json:"offset,omitempty"`
	Order     *string `json:"order,omitempty"`
	Ascending *bool   `json:"ascending,omitempty"`
}

// EventMarket represents a market within an event
type EventMarket struct {
	ID                  string     `json:"id"`
	Question            string     `json:"question"`
	ConditionID         string     `json:"conditionId"`
	Slug                string     `json:"slug"`
	ResolutionSource    *string    `json:"resolutionSource,omitempty"`
	EndDate             *string    `json:"endDate,omitempty"`
	Liquidity           *string    `json:"liquidity,omitempty"`
	StartDate           *string    `json:"startDate,omitempty"`
	Image               string     `json:"image"`
	Icon                string     `json:"icon"`
	Description         string     `json:"description"`
	Outcomes            []string   `json:"outcomes"`           // Parsed from JSON string
	OutcomePrices       []string   `json:"outcomePrices"`      // Parsed from JSON string
	Volume              *string    `json:"volume,omitempty"`
	Active              bool       `json:"active"`
	Closed              bool       `json:"closed"`
	MarketMakerAddress  *string    `json:"marketMakerAddress,omitempty"`
	CreatedAt           string     `json:"createdAt"`
	UpdatedAt           string     `json:"updatedAt"`
	New                 *bool      `json:"new,omitempty"`
	ClobTokenIDs        []string   `json:"clobTokenIds"`      // Parsed from JSON string
}

// Event represents a collection of related markets
type Event struct {
	ID                     string          `json:"id"`
	Ticker                 string          `json:"ticker"`
	Slug                   string          `json:"slug"`
	Title                  string          `json:"title"`
	Description            *string         `json:"description,omitempty"`
	ResolutionSource       *string         `json:"resolutionSource,omitempty"`
	StartDate              *string         `json:"startDate,omitempty"`
	CreationDate           *string         `json:"creationDate,omitempty"`
	EndDate                *string         `json:"endDate,omitempty"`
	Image                  string          `json:"image"`
	Icon                   string          `json:"icon"`
	Active                 bool            `json:"active"`
	Closed                 bool            `json:"closed"`
	Archived               bool            `json:"archived"`
	New                    *bool           `json:"new,omitempty"`
	Featured               *bool           `json:"featured,omitempty"`
	Restricted             *bool           `json:"restricted,omitempty"`
	Liquidity              *float64        `json:"liquidity,omitempty"`
	Volume                 *float64        `json:"volume,omitempty"`
	Volume24hr             *float64        `json:"volume24hr,omitempty"`
	VolumeNum              *float64        `json:"volumeNum,omitempty"`
	LastActiveAt           *string         `json:"lastActiveAt,omitempty"`
	LiquidityAmm           *float64        `json:"liquidityAmm,omitempty"`
	LiquidityNum           *float64        `json:"liquidityNum,omitempty"`
	Markets                []EventMarket   `json:"markets"`
	Series                 []Series        `json:"series,omitempty"`
	Tags                   []Tag           `json:"tags,omitempty"`
	Cyom                   *bool           `json:"cyom,omitempty"`
	ShowAllOutcomes        *bool           `json:"showAllOutcomes,omitempty"`
	ShowMarketImages       *bool           `json:"showMarketImages,omitempty"`
	EnableNegRisk          *bool           `json:"enableNegRisk,omitempty"`
	AutomaticallyActive    *bool           `json:"automaticallyActive,omitempty"`
	SeriesSlug             *string         `json:"seriesSlug,omitempty"`
	GmpChartMode           *string         `json:"gmpChartMode,omitempty"`
	NegRiskAugmented       *bool           `json:"negRiskAugmented,omitempty"`
	PendingDeployment      *bool           `json:"pendingDeployment,omitempty"`
	Deploying              *bool           `json:"deploying,omitempty"`
	SortBy                 *string         `json:"sortBy,omitempty"`
	ClosedTime             *string         `json:"closedTime,omitempty"`
	AutomaticallyResolved  *bool           `json:"automaticallyResolved,omitempty"`
}

// UpdatedEventQuery represents query parameters for events
type UpdatedEventQuery struct {
	Limit      *int      `json:"limit,omitempty"`
	Offset     *int      `json:"offset,omitempty"`
	Order      *string   `json:"order,omitempty"`
	Ascending  *bool     `json:"ascending,omitempty"`
	Search     *string   `json:"search,omitempty"`
	Active     *bool     `json:"active,omitempty"`
	Closed     *bool     `json:"closed,omitempty"`
	Archived   *bool     `json:"archived,omitempty"`
	Featured   *bool     `json:"featured,omitempty"`
	New        *bool     `json:"new,omitempty"`
	Restricted *bool     `json:"restricted,omitempty"`
	MinVolume  *float64  `json:"minVolume,omitempty"`
	MaxVolume  *float64  `json:"maxVolume,omitempty"`
	MinLiquidity *float64 `json:"minLiquidity,omitempty"`
	MaxLiquidity *float64 `json:"maxLiquidity,omitempty"`
	Series     *string   `json:"series,omitempty"`
	Tag        *string   `json:"tag,omitempty"`
	StartDate  *string   `json:"startDate,omitempty"`
	EndDate    *string   `json:"endDate,omitempty"`
}

// PaginatedEventQuery represents query parameters for paginated events
type PaginatedEventQuery struct {
	Limit      *int      `json:"limit,omitempty"`
	Offset     *int      `json:"offset,omitempty"`
	Order      *string   `json:"order,omitempty"`
	Ascending  *bool     `json:"ascending,omitempty"`
	Search     *string   `json:"search,omitempty"`
	Active     *bool     `json:"active,omitempty"`
	Closed     *bool     `json:"closed,omitempty"`
	Archived   *bool     `json:"archived,omitempty"`
	Featured   *bool     `json:"featured,omitempty"`
	New        *bool     `json:"new,omitempty"`
	Restricted *bool     `json:"restricted,omitempty"`
	Series     *string   `json:"series,omitempty"`
	Tag        *string   `json:"tag,omitempty"`
	StartDate  *string   `json:"startDate,omitempty"`
	EndDate    *string   `json:"endDate,omitempty"`
}

// EventByIdQuery represents query parameters for getting event by ID
type EventByIdQuery struct {
	IncludeChat *bool `json:"include_chat,omitempty"`
}

// Market represents a trading market
type Market struct {
	ID               string     `json:"id"`
	Question         string     `json:"question"`
	ConditionID      string     `json:"conditionId"`
	Slug             string     `json:"slug"`
	Liquidity        *string    `json:"liquidity,omitempty"`
	StartDate        *string    `json:"startDate,omitempty"`
	Image            string     `json:"image"`
	Icon             string     `json:"icon"`
	Description      string     `json:"description"`
	Active           bool       `json:"active"`
	Volume           string     `json:"volume"`
	Outcomes         []string   `json:"outcomes"`         // Parsed from JSON string
	OutcomePrices    []string   `json:"outcomePrices"`    // Parsed from JSON string
	Closed           bool       `json:"closed"`
	New              *bool      `json:"new,omitempty"`
	QuestionID       *string    `json:"questionId,omitempty"`
	VolumeNum        float64    `json:"volumeNum"`
	LiquidityNum     *float64   `json:"liquidityNum,omitempty"`
	StartDateIso     *string    `json:"startDateIso,omitempty"`
	HasReviewedDates *bool      `json:"hasReviewedDates,omitempty"`
	ClobTokenIDs     []string   `json:"clobTokenIds"`     // Parsed from JSON string
	EndDate          *string    `json:"endDate,omitempty"`
	LastActiveAt     *string    `json:"lastActiveAt,omitempty"`
}

// UpdatedMarketQuery represents query parameters for markets
type UpdatedMarketQuery struct {
	Limit         *int     `json:"limit,omitempty"`
	Offset        *int     `json:"offset,omitempty"`
	Order         *string  `json:"order,omitempty"`
	Ascending     *bool    `json:"ascending,omitempty"`
	Search        *string  `json:"search,omitempty"`
	Active        *bool    `json:"active,omitempty"`
	Closed        *bool    `json:"closed,omitempty"`
	New           *bool    `json:"new,omitempty"`
	Event         *string  `json:"event,omitempty"`
	EventSlug     *string  `json:"eventSlug,omitempty"`
	Series        *string  `json:"series,omitempty"`
	SeriesSlug    *string  `json:"seriesSlug,omitempty"`
	Tag           *string  `json:"tag,omitempty"`
	MinVolume     *float64 `json:"minVolume,omitempty"`
	MaxVolume     *float64 `json:"maxVolume,omitempty"`
	MinLiquidity  *float64 `json:"minLiquidity,omitempty"`
	MaxLiquidity  *float64 `json:"maxLiquidity,omitempty"`
	StartDate     *string  `json:"startDate,omitempty"`
	EndDate       *string  `json:"endDate,omitempty"`
	QuestionID    *string  `json:"questionId,omitempty"`
	ConditionID   *string  `json:"conditionId,omitempty"`
}

// MarketByIdQuery represents query parameters for getting market by ID
type MarketByIdQuery struct {
	IncludeTag *bool `json:"include_tag,omitempty"`
}

// Series represents a series of related events
type Series struct {
	ID            string     `json:"id"`
	Ticker        string     `json:"ticker"`
	Slug          string     `json:"slug"`
	Title         string     `json:"title"`
	Subtitle      *string    `json:"subtitle,omitempty"`
	SeriesType    *string    `json:"seriesType,omitempty"`
	Recurrence    *string    `json:"recurrence,omitempty"`
	Image         *string    `json:"image,omitempty"`
	Icon          *string    `json:"icon,omitempty"`
	Active        bool       `json:"active"`
	Closed        bool       `json:"closed"`
	Archived      bool       `json:"archived"`
	Volume        *float64   `json:"volume,omitempty"`
	Liquidity     *float64   `json:"liquidity,omitempty"`
	StartDate     *string    `json:"startDate,omitempty"`
	CreatedAt     string     `json:"createdAt"`
	UpdatedAt     string     `json:"updatedAt"`
	Competitive   *float64   `json:"competitive,omitempty"`
	Volume24hr    *float64   `json:"volume24hr,omitempty"`
	PythTokenID   *string    `json:"pythTokenId,omitempty"`
	LastActiveAt  *string    `json:"lastActiveAt,omitempty"`
	SeriesTypeMap *string    `json:"seriesTypeMap,omitempty"`
}

// SeriesQuery represents query parameters for series
type SeriesQuery struct {
	Limit     *int    `json:"limit,omitempty"`
	Offset    *int    `json:"offset,omitempty"`
	Order     *string `json:"order,omitempty"`
	Ascending *bool   `json:"ascending,omitempty"`
	Search    *string `json:"search,omitempty"`
	Active    *bool   `json:"active,omitempty"`
	Closed    *bool   `json:"closed,omitempty"`
	Archived  *bool   `json:"archived,omitempty"`
	MinVolume *float64 `json:"minVolume,omitempty"`
	MaxVolume *float64 `json:"maxVolume,omitempty"`
	StartDate *string `json:"startDate,omitempty"`
	EndDate   *string `json:"endDate,omitempty"`
}

// SeriesByIdQuery represents query parameters for getting series by ID
type SeriesByIdQuery struct {
	IncludeChat *bool `json:"include_chat,omitempty"`
}

// Comment represents a user comment
type Comment struct {
	ID              string      `json:"id"`
	Body            string      `json:"body"`
	ParentEntityType string      `json:"parentEntityType"`
	ParentEntityID  int         `json:"parentEntityID"`
	UserAddress     string      `json:"userAddress"`
	CreatedAt       string      `json:"createdAt"`
	Profile         interface{} `json:"profile,omitempty"`         // Profile object structure can vary
	Reactions       interface{} `json:"reactions,omitempty"`      // Reaction objects can vary
	ReportCount     int         `json:"reportCount"`
	ReactionCount   int         `json:"reactionCount"`
}

// CommentQuery represents query parameters for comments
type CommentQuery struct {
	Limit           *int    `json:"limit,omitempty"`
	Offset          *int    `json:"offset,omitempty"`
	Order           *string `json:"order,omitempty"`
	Ascending       *bool   `json:"ascending,omitempty"`
	ParentEntityType *string `json:"parent_entity_type,omitempty"`
	ParentEntityID  *int   `json:"parent_entity_id,omitempty"`
}

// CommentByIdQuery represents query parameters for getting comments by ID
type CommentByIdQuery struct {
	Limit     *int    `json:"limit,omitempty"`
	Offset    *int    `json:"offset,omitempty"`
	Order     *string `json:"order,omitempty"`
	Ascending *bool   `json:"ascending,omitempty"`
}

// CommentsByUserQuery represents query parameters for getting comments by user
type CommentsByUserQuery struct {
	Limit     *int    `json:"limit,omitempty"`
	Offset    *int    `json:"offset,omitempty"`
	Order     *string `json:"order,omitempty"`
	Ascending *bool   `json:"ascending,omitempty"`
}

// SearchQuery represents query parameters for search
type SearchQuery struct {
	Q               *string  `json:"q,omitempty"`
	LimitPerType    *int     `json:"limit_per_type,omitempty"`
	EventsStatus    *string  `json:"events_status,omitempty"`
	EventsActive    *bool    `json:"events_active,omitempty"`
	EventsClosed    *bool    `json:"events_closed,omitempty"`
	EventsArchived  *bool    `json:"events_archived,omitempty"`
	EventsFeatured  *bool    `json:"events_featured,omitempty"`
	MarketsActive   *bool    `json:"markets_active,omitempty"`
	MarketsClosed   *bool    `json:"markets_closed,omitempty"`
	TagsCarousel    *bool    `json:"tags_carousel,omitempty"`
	SeriesActive    *bool    `json:"series_active,omitempty"`
	SeriesClosed    *bool    `json:"series_closed,omitempty"`
}

// SearchResponse represents the response from search API
type SearchResponse struct {
	Events     []interface{} `json:"events,omitempty"`     // Event objects
	Tags       []interface{} `json:"tags,omitempty"`       // Tag objects with counts
	Profiles   []interface{} `json:"profiles,omitempty"`   // Profile objects
	Pagination *Pagination   `json:"pagination,omitempty"` // Pagination info
}

// Pagination represents pagination information
type Pagination struct {
	HasMore bool `json:"hasMore"`
}

// APIResponse represents a generic API response
type APIResponse struct {
	Data      json.RawMessage `json:"data"`
	Status    int            `json:"status"`
	OK        bool           `json:"ok"`
	ErrorData interface{}    `json:"errorData,omitempty"`
}

// GammaError represents an error response from the Gamma API
type GammaError struct {
	Message   string `json:"message"`
	Code      int    `json:"code"`
	Timestamp string `json:"timestamp"`
	Path      string `json:"path"`
}

// PaginatedEventsResponse represents paginated events response
type PaginatedEventsResponse struct {
	Data       []Event     `json:"data"`
	Pagination Pagination `json:"pagination"`
}

// IPResponse represents the response from IP detection services
type IPResponse struct {
	IP       string `json:"ip"`
	Country  string `json:"country,omitempty"`
	Region   string `json:"region,omitempty"`
	City     string `json:"city,omitempty"`
	ISP      string `json:"isp,omitempty"`
	Org      string `json:"org,omitempty"`
	AS       string `json:"as,omitempty"`
	Hostname string `json:"hostname,omitempty"`
}

// StringPtr creates a pointer to a string
func StringPtr(s string) *string {
	return &s
}

// IntPtr creates a pointer to an int
func IntPtr(i int) *int {
	return &i
}

// BoolPtr creates a pointer to a bool
func BoolPtr(b bool) *bool {
	return &b
}

// ProxyConfigFromURL creates a ProxyConfig from a proxy URL string
// Examples:
//   - "http://proxy.example.com:8080"
//   - "https://user:pass@proxy.example.com:3128"
//   - "socks5://127.0.0.1:1080"
func ProxyConfigFromURL(proxyURL string) (*ProxyConfig, error) {
	parsed, err := url.Parse(proxyURL)
	if err != nil {
		return nil, fmt.Errorf("invalid proxy URL: %w", err)
	}

	config := &ProxyConfig{
		Host:     parsed.Hostname(),
		Protocol: StringPtr(parsed.Scheme),
	}

	// Parse port
	if parsed.Port() != "" {
		port, err := strconv.Atoi(parsed.Port())
		if err != nil {
			return nil, fmt.Errorf("invalid proxy port: %w", err)
		}
		config.Port = port
	}

	// Parse authentication
	if parsed.User != nil {
		username := parsed.User.Username()
		if username != "" {
			config.Username = &username
		}
		password, hasPassword := parsed.User.Password()
		if hasPassword && password != "" {
			config.Password = &password
		}
	}

	return config, nil
}