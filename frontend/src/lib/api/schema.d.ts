export interface paths {
    "/api/v1/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Register */
        post: operations["register_api_v1_auth_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_v1_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Me */
        get: operations["me_api_v1_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update */
        patch: operations["update_api_v1_me_patch"];
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout */
        post: operations["logout_api_v1_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Password */
        post: operations["password_api_v1_auth_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/reset/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset Request */
        post: operations["reset_request_api_v1_auth_reset_request_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/reset/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset Confirm */
        post: operations["reset_confirm_api_v1_auth_reset_confirm_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/verify/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Verify Request */
        post: operations["verify_request_api_v1_auth_verify_request_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/verify/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Verify */
        post: operations["verify_api_v1_auth_verify_confirm_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Remove */
        post: operations["remove_api_v1_me_delete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/access": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Admin */
        get: operations["admin_api_v1_admin_access_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Items */
        get: operations["items_api_v1_workspace_get"];
        put?: never;
        /** Create */
        post: operations["create_api_v1_workspace_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspace/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update */
        put: operations["update_api_v1_workspace__identifier__put"];
        post?: never;
        /** Remove */
        delete: operations["remove_api_v1_workspace__identifier__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workspace/songs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Songs */
        get: operations["songs_api_v1_workspace_songs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/custom-chords": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Chords */
        get: operations["list_chords_api_v1_custom_chords_get"];
        put?: never;
        /** Create Chord */
        post: operations["create_chord_api_v1_custom_chords_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/custom-chords/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Chord */
        put: operations["update_chord_api_v1_custom_chords__identifier__put"];
        post?: never;
        /** Delete Chord */
        delete: operations["delete_chord_api_v1_custom_chords__identifier__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/patterns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Patterns */
        get: operations["list_patterns_api_v1_patterns_get"];
        put?: never;
        /** Create Pattern */
        post: operations["create_pattern_api_v1_patterns_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/patterns/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Pattern */
        put: operations["update_pattern_api_v1_patterns__identifier__put"];
        post?: never;
        /** Delete Pattern */
        delete: operations["delete_pattern_api_v1_patterns__identifier__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/patterns/{identifier}/favorite": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Favorite Pattern */
        put: operations["favorite_pattern_api_v1_patterns__identifier__favorite_put"];
        post?: never;
        /** Unfavorite Pattern */
        delete: operations["unfavorite_pattern_api_v1_patterns__identifier__favorite_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/managed-patterns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Managed Patterns */
        get: operations["managed_patterns_api_v1_managed_patterns_get"];
        put?: never;
        /** Create Shared */
        post: operations["create_shared_api_v1_managed_patterns_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/managed-patterns/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Shared */
        put: operations["update_shared_api_v1_managed_patterns__identifier__put"];
        post?: never;
        /** Archive Shared */
        delete: operations["archive_shared_api_v1_managed_patterns__identifier__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/songs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Songs */
        get: operations["list_songs_api_v1_songs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/songs/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Song */
        get: operations["song_api_v1_songs__identifier__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/song-imports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Stage Import */
        post: operations["stage_import_api_v1_song_imports_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/song-imports/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Preview Import */
        get: operations["preview_import_api_v1_song_imports__identifier__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/song-imports/{identifier}/commit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Commit Import */
        post: operations["commit_import_api_v1_song_imports__identifier__commit_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/managed-songs/{identifier}/withdraw": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Withdraw Song */
        post: operations["withdraw_song_api_v1_managed_songs__identifier__withdraw_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Active */
        get: operations["active_api_v1_practice_current_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** History */
        get: operations["history_api_v1_practice_sessions_get"];
        put?: never;
        /** Start */
        post: operations["start_api_v1_practice_sessions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/sessions/{identifier}/{action}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Command */
        post: operations["command_api_v1_practice_sessions__identifier___action__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/sessions/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Session */
        get: operations["get_session_api_v1_practice_sessions__identifier__get"];
        /** Update Session */
        put: operations["update_session_api_v1_practice_sessions__identifier__put"];
        post?: never;
        /** Delete Session */
        delete: operations["delete_session_api_v1_practice_sessions__identifier__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/routines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Routines */
        get: operations["routines_api_v1_practice_routines_get"];
        put?: never;
        /** Create Routine */
        post: operations["create_routine_api_v1_practice_routines_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/routines/{identifier}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Routine */
        get: operations["get_routine_api_v1_practice_routines__identifier__get"];
        /** Update Routine */
        put: operations["update_routine_api_v1_practice_routines__identifier__put"];
        post?: never;
        /** Delete Routine */
        delete: operations["delete_routine_api_v1_practice_routines__identifier__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/routines/{identifier}/duplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Duplicate Routine */
        post: operations["duplicate_routine_api_v1_practice_routines__identifier__duplicate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/goals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Goals */
        get: operations["goals_api_v1_practice_goals_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practice/goals/{period}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Goal */
        put: operations["goal_api_v1_practice_goals__period__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Live */
        get: operations["live_api_v1_health_live_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ready */
        get: operations["ready_api_v1_health_ready_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** ActivityInput */
        ActivityInput: {
            /** Name */
            name: string;
            /** Duration Seconds */
            duration_seconds: number;
            /**
             * Tool
             * @default none
             * @enum {string}
             */
            tool: "none" | "metronome" | "chords" | "pattern" | "song" | "tuner";
            /**
             * Bpm
             * @default 100
             */
            bpm: number;
            /** Song Id */
            song_id?: string | null;
            /** Chord Id */
            chord_id?: string | null;
            /** Pattern Id */
            pattern_id?: string | null;
            /**
             * Chord Name
             * @default
             */
            chord_name: string;
        };
        /** ArrangementInput */
        ArrangementInput: {
            /** Key */
            key: string;
            /** Name */
            name: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "guitar" | "bass" | "ukulele";
            /**
             * Tuning
             * @default standard
             * @enum {string}
             */
            tuning: "standard" | "drop_d" | "dadgad" | "reentrant";
            /**
             * Difficulty
             * @enum {string}
             */
            difficulty: "beginner" | "intermediate" | "advanced";
            /** Capo */
            capo?: number | null;
            /** Key Note */
            key_note?: string | null;
            /** Chords */
            chords: string[];
            /** Placements */
            placements?: components["schemas"]["ChordPlacement"][];
            /** Text Key */
            text_key?: string | null;
            /** Pattern Id */
            pattern_id?: string | null;
            /**
             * Guidance
             * @default
             */
            guidance: string;
            grant: components["schemas"]["Grant"];
        };
        /** ChordInput */
        ChordInput: {
            /** Name */
            name: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "guitar" | "bass" | "ukulele";
            /** Frets */
            frets: number[];
            /** Fingers */
            fingers: number[];
        };
        /** ChordPlacement */
        ChordPlacement: {
            /** Line */
            line: number;
            /** Offset */
            offset: number;
            /** Chord */
            chord: string;
        };
        /** ChordView */
        ChordView: {
            /** Name */
            name: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "guitar" | "bass" | "ukulele";
            /** Frets */
            frets: number[];
            /** Fingers */
            fingers: number[];
            /**
             * Id
             * Format: uuid
             */
            id: string;
        };
        /** Command */
        Command: {
            /** Version */
            version: number;
            /**
             * Confirm Long
             * @default false
             */
            confirm_long: boolean;
        };
        /** Credentials */
        Credentials: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** Duplicate */
        Duplicate: {
            /**
             * Client Key
             * Format: uuid
             */
            client_key: string;
        };
        /** EmailInput */
        EmailInput: {
            /**
             * Email
             * Format: email
             */
            email: string;
        };
        /** ErrorDetail */
        ErrorDetail: {
            /** Code */
            code: string;
            /** Message */
            message: string;
            /** Request Id */
            request_id: string;
            /**
             * Fields
             * @default []
             */
            fields: components["schemas"]["FieldError"][];
        };
        /** ErrorResponse */
        ErrorResponse: {
            error: components["schemas"]["ErrorDetail"];
        };
        /** FieldError */
        FieldError: {
            /** Field */
            field: string;
            /** Code */
            code: string;
        };
        /** GoalInput */
        GoalInput: {
            /** Minutes */
            minutes: number;
            /**
             * Paused
             * @default false
             */
            paused: boolean;
            /**
             * Version
             * @default 0
             */
            version: number;
        };
        /** GoalView */
        GoalView: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Period
             * @enum {string}
             */
            period: "daily" | "weekly";
            /** Minutes */
            minutes: number;
            /** Paused */
            paused: boolean;
            /** Version */
            version: number;
            /**
             * Effective From
             * Format: date-time
             */
            effective_from: string;
        };
        /** Grant */
        Grant: {
            /**
             * Origin
             * @enum {string}
             */
            origin: "application" | "user_submission" | "third_party";
            /** License */
            license: string;
            /** Source Url */
            source_url: string;
            /** Attribution */
            attribution: string;
            /** Evidence */
            evidence: string;
            /** Terms Version */
            terms_version: string;
            /** Reviewer */
            reviewer: string;
            /**
             * Reviewed
             * @default false
             */
            reviewed: boolean;
            /**
             * Display
             * @default false
             */
            display: boolean;
            /**
             * Cache
             * @default false
             */
            cache: boolean;
            /**
             * Transpose
             * @default false
             */
            transpose: boolean;
            /** Territories */
            territories?: string[];
            /** Expires At */
            expires_at?: string | null;
        };
        /** Health */
        Health: {
            /** Status */
            status: string;
        };
        /** ImportInput */
        ImportInput: {
            /** Key */
            key: string;
            /**
             * Replace Existing
             * @default false
             */
            replace_existing: boolean;
            /** Items */
            items: components["schemas"]["SongInput"][];
        };
        /** ImportView */
        ImportView: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Key */
            key: string;
            /** State */
            state: string;
            /** Count */
            count: number;
            /** Issues */
            issues: string[];
        };
        /** IntervalView */
        IntervalView: {
            /**
             * Start
             * Format: date-time
             */
            start: string;
            /**
             * End
             * Format: date-time
             */
            end: string;
        };
        /** Message */
        Message: {
            /** Message */
            message: string;
        };
        /** PasswordChange */
        PasswordChange: {
            /** Current Password */
            current_password: string;
            /** New Password */
            new_password: string;
        };
        /** PatternInput */
        PatternInput: {
            /** Name */
            name: string;
            /**
             * Meter
             * @enum {string}
             */
            meter: "2/4" | "3/4" | "4/4" | "6/8";
            /** Subdivision */
            subdivision: number;
            /** Strokes */
            strokes: ("D" | "U" | "R" | "X")[];
            /**
             * Tempo Min
             * @default 60
             */
            tempo_min: number;
            /**
             * Tempo Max
             * @default 140
             */
            tempo_max: number;
            /**
             * Difficulty
             * @default beginner
             * @enum {string}
             */
            difficulty: "beginner" | "intermediate" | "advanced";
            /**
             * Style
             * @default General
             */
            style: string;
            /**
             * Description
             * @default
             */
            description: string;
        };
        /** PatternView */
        PatternView: {
            /** Name */
            name: string;
            /**
             * Meter
             * @enum {string}
             */
            meter: "2/4" | "3/4" | "4/4" | "6/8";
            /** Subdivision */
            subdivision: number;
            /** Strokes */
            strokes: ("D" | "U" | "R" | "X")[];
            /**
             * Tempo Min
             * @default 60
             */
            tempo_min: number;
            /**
             * Tempo Max
             * @default 140
             */
            tempo_max: number;
            /**
             * Difficulty
             * @default beginner
             * @enum {string}
             */
            difficulty: "beginner" | "intermediate" | "advanced";
            /**
             * Style
             * @default General
             */
            style: string;
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Status */
            status: string;
            /**
             * Favorite
             * @default false
             */
            favorite: boolean;
            /** Attribution */
            attribution: string;
            /** Rights Statement */
            rights_statement: string;
            /** Reviewed */
            reviewed: boolean;
        };
        /** Profile */
        Profile: {
            /** Id */
            id: string;
            /** Email */
            email: string | null;
            /** Display Name */
            display_name: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /**
             * Skill
             * @enum {string}
             */
            skill: "beginner" | "intermediate" | "advanced";
            /** Timezone */
            timezone: string;
            /**
             * Theme
             * @enum {string}
             */
            theme: "system" | "light" | "dark";
            /**
             * Handedness
             * @enum {string}
             */
            handedness: "right" | "left";
            /** Tuning */
            tuning: string;
            /**
             * Chord Display
             * @enum {string}
             */
            chord_display: "diagrams" | "fretboard";
            /** Interests */
            interests: string;
            /** Onboarding Complete */
            onboarding_complete: boolean;
            /** Email Verified */
            email_verified: boolean;
            /** Role */
            role: string;
            /** Csrf Token */
            csrf_token: string;
        };
        /** ProfileUpdate */
        ProfileUpdate: {
            /** Display Name */
            display_name: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /**
             * Skill
             * @enum {string}
             */
            skill: "beginner" | "intermediate" | "advanced";
            /** Timezone */
            timezone: string;
            /**
             * Theme
             * @default system
             * @enum {string}
             */
            theme: "system" | "light" | "dark";
            /**
             * Handedness
             * @default right
             * @enum {string}
             */
            handedness: "right" | "left";
            /**
             * Tuning
             * @default standard
             */
            tuning: string;
            /**
             * Chord Display
             * @default diagrams
             * @enum {string}
             */
            chord_display: "diagrams" | "fretboard";
            /**
             * Interests
             * @default
             */
            interests: string;
            /**
             * Onboarding Complete
             * @default true
             */
            onboarding_complete: boolean;
        };
        /** Registration */
        Registration: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
            /** Display Name */
            display_name: string;
            /** Acknowledge Privacy */
            acknowledge_privacy: boolean;
        };
        /** ResetInput */
        ResetInput: {
            /** Token */
            token: string;
            /** Password */
            password: string;
        };
        /** RoutineCreate */
        RoutineCreate: {
            /** Name */
            name: string;
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /** Activities */
            activities: components["schemas"]["ActivityInput"][];
            /**
             * Client Key
             * Format: uuid
             */
            client_key: string;
        };
        /** RoutineUpdate */
        RoutineUpdate: {
            /** Name */
            name: string;
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /** Activities */
            activities: components["schemas"]["ActivityInput"][];
            /** Version */
            version: number;
        };
        /** RoutineView */
        RoutineView: {
            /** Name */
            name: string;
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /** Activities */
            activities: components["schemas"]["ActivityInput"][];
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Version */
            version: number;
            /** Warnings */
            warnings?: string[];
        };
        /** SensitiveInput */
        SensitiveInput: {
            /** Current Password */
            current_password: string;
            /**
             * Confirm
             * @default false
             */
            confirm: boolean;
        };
        /** SessionStart */
        SessionStart: {
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /**
             * Focus
             * @default
             */
            focus: string;
            /**
             * Notes
             * @default
             */
            notes: string;
            /** Song Id */
            song_id?: string | null;
            /** Chord Id */
            chord_id?: string | null;
            /**
             * Chord Name
             * @default
             */
            chord_name: string;
            /**
             * Client Key
             * Format: uuid
             */
            client_key: string;
            /** Routine Id */
            routine_id?: string | null;
            /** Target Seconds */
            target_seconds?: number | null;
        };
        /** SessionUpdate */
        SessionUpdate: {
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /**
             * Focus
             * @default
             */
            focus: string;
            /**
             * Notes
             * @default
             */
            notes: string;
            /** Song Id */
            song_id?: string | null;
            /** Chord Id */
            chord_id?: string | null;
            /**
             * Chord Name
             * @default
             */
            chord_name: string;
            /** Version */
            version: number;
            /**
             * Confirm Long
             * @default false
             */
            confirm_long: boolean;
            /** Corrected Start */
            corrected_start?: string | null;
            /** Corrected Seconds */
            corrected_seconds?: number | null;
        };
        /** SessionView */
        SessionView: {
            /**
             * Instrument
             * @enum {string}
             */
            instrument: "acoustic_guitar" | "electric_guitar" | "bass" | "ukulele";
            /**
             * Focus
             * @default
             */
            focus: string;
            /**
             * Notes
             * @default
             */
            notes: string;
            /** Song Id */
            song_id?: string | null;
            /** Chord Id */
            chord_id?: string | null;
            /**
             * Chord Name
             * @default
             */
            chord_name: string;
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * State
             * @enum {string}
             */
            state: "active" | "paused" | "ended" | "saved";
            /**
             * Started At
             * Format: date-time
             */
            started_at: string;
            /** Ended At */
            ended_at: string | null;
            /** Running Since */
            running_since: string | null;
            /** Intervals */
            intervals: components["schemas"]["IntervalView"][];
            /** Duration Seconds */
            duration_seconds: number;
            /** Target Seconds */
            target_seconds: number | null;
            /** Timezone */
            timezone: string;
            /** Version */
            version: number;
            /** Routine Id */
            routine_id: string | null;
            routine_snapshot: components["schemas"]["RoutineView"] | null;
            /**
             * As Of
             * Format: date-time
             */
            as_of: string;
        };
        /** SharedPatternInput */
        SharedPatternInput: {
            /** Name */
            name: string;
            /**
             * Meter
             * @enum {string}
             */
            meter: "2/4" | "3/4" | "4/4" | "6/8";
            /** Subdivision */
            subdivision: number;
            /** Strokes */
            strokes: ("D" | "U" | "R" | "X")[];
            /**
             * Tempo Min
             * @default 60
             */
            tempo_min: number;
            /**
             * Tempo Max
             * @default 140
             */
            tempo_max: number;
            /**
             * Difficulty
             * @default beginner
             * @enum {string}
             */
            difficulty: "beginner" | "intermediate" | "advanced";
            /**
             * Style
             * @default General
             */
            style: string;
            /**
             * Description
             * @default
             */
            description: string;
            /**
             * Status
             * @default draft
             * @enum {string}
             */
            status: "draft" | "published" | "archived";
            /**
             * Reviewed
             * @default false
             */
            reviewed: boolean;
            /**
             * Rights Statement
             * @default
             */
            rights_statement: string;
            /**
             * Attribution
             * @default
             */
            attribution: string;
        };
        /** SongDetail */
        SongDetail: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Title */
            title: string;
            /** Artist */
            artist: string;
            /** Language */
            language: string;
            /** Aliases */
            aliases: string[];
            /** Genre */
            genre: string | null;
            /**
             * Version Note
             * @default
             */
            version_note: string;
            /** Arrangement Count */
            arrangement_count: number;
            /** Text Count */
            text_count: number;
            metadata_grant: components["schemas"]["Grant"];
            /** Arrangements */
            arrangements: components["schemas"]["ArrangementInput"][];
            /** Texts */
            texts: components["schemas"]["TextInput"][];
            /** Lyrics Url */
            lyrics_url: string | null;
            /** Revision */
            revision: number;
        };
        /** SongInput */
        SongInput: {
            /** External Key */
            external_key: string;
            /** Title */
            title: string;
            /** Artist */
            artist: string;
            /**
             * Language
             * @enum {string}
             */
            language: "en" | "ur" | "hi";
            /** Aliases */
            aliases?: string[];
            /** Genre */
            genre?: string | null;
            /**
             * Version Note
             * @default
             */
            version_note: string;
            metadata_grant: components["schemas"]["Grant"];
            /** Arrangements */
            arrangements?: components["schemas"]["ArrangementInput"][];
            /** Texts */
            texts?: components["schemas"]["TextInput"][];
            /** Lyrics Url */
            lyrics_url?: string | null;
            /**
             * Lyrics Link Verified
             * @default false
             */
            lyrics_link_verified: boolean;
        };
        /** SongPage */
        SongPage: {
            /** Items */
            items: components["schemas"]["SongSummary"][];
            /** Total */
            total: number;
            /** Offset */
            offset: number;
            /** Limit */
            limit: number;
        };
        /** SongSummary */
        SongSummary: {
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /** Title */
            title: string;
            /** Artist */
            artist: string;
            /** Language */
            language: string;
            /** Aliases */
            aliases: string[];
            /** Genre */
            genre: string | null;
            /**
             * Version Note
             * @default
             */
            version_note: string;
            /** Arrangement Count */
            arrangement_count: number;
            /** Text Count */
            text_count: number;
        };
        /** TextInput */
        TextInput: {
            /** Key */
            key: string;
            /**
             * Language
             * @enum {string}
             */
            language: "en" | "ur" | "hi";
            /**
             * Script
             * @enum {string}
             */
            script: "Latn" | "Arab" | "Deva";
            /** Label */
            label: string;
            /** Lines */
            lines: string[];
            grant: components["schemas"]["Grant"];
        };
        /** TokenInput */
        TokenInput: {
            /** Token */
            token: string;
        };
        /** Withdrawal */
        Withdrawal: {
            /**
             * Component
             * @enum {string}
             */
            component: "metadata" | "arrangement" | "text";
            /** Key */
            key?: string | null;
        };
        /** WorkspaceInput */
        WorkspaceInput: {
            /**
             * Kind
             * @enum {string}
             */
            kind: "task" | "collection" | "note" | "favorite";
            /** Title */
            title: string;
            /**
             * Body
             * @default
             */
            body: string;
            /**
             * Priority
             * @default normal
             * @enum {string}
             */
            priority: "low" | "normal" | "high";
            /**
             * Category
             * @default
             */
            category: string;
            /** Due */
            due?: string | null;
            /**
             * Completed
             * @default false
             */
            completed: boolean;
            /** Collection Id */
            collection_id?: string | null;
            /** Song Id */
            song_id?: string | null;
            /**
             * Learning Status
             * @default learning
             * @enum {string}
             */
            learning_status: "learning" | "practicing" | "comfortable";
        };
        /** WorkspaceView */
        WorkspaceView: {
            /**
             * Kind
             * @enum {string}
             */
            kind: "task" | "collection" | "note" | "favorite";
            /** Title */
            title: string;
            /**
             * Body
             * @default
             */
            body: string;
            /**
             * Priority
             * @default normal
             * @enum {string}
             */
            priority: "low" | "normal" | "high";
            /**
             * Category
             * @default
             */
            category: string;
            /** Due */
            due?: string | null;
            /**
             * Completed
             * @default false
             */
            completed: boolean;
            /** Collection Id */
            collection_id?: string | null;
            /** Song Id */
            song_id?: string | null;
            /**
             * Learning Status
             * @default learning
             * @enum {string}
             */
            learning_status: "learning" | "practicing" | "comfortable";
            /**
             * Id
             * Format: uuid
             */
            id: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    register_api_v1_auth_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Registration"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    login_api_v1_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Credentials"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    me_api_v1_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_api_v1_me_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfileUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    logout_api_v1_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    password_api_v1_auth_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordChange"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reset_request_api_v1_auth_reset_request_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    reset_confirm_api_v1_auth_reset_confirm_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    verify_request_api_v1_auth_verify_request_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    verify_api_v1_auth_verify_confirm_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TokenInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    remove_api_v1_me_delete_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SensitiveInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    admin_api_v1_admin_access_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Message"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Too Many Requests */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    items_api_v1_workspace_get: {
        parameters: {
            query?: {
                kind?: ("task" | "collection" | "note" | "favorite") | null;
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkspaceView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_api_v1_workspace_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkspaceInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkspaceView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_api_v1_workspace__identifier__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkspaceInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkspaceView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    remove_api_v1_workspace__identifier__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    songs_api_v1_workspace_songs_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    }[];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_chords_api_v1_custom_chords_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChordView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_chord_api_v1_custom_chords_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChordInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChordView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_chord_api_v1_custom_chords__identifier__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChordInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChordView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_chord_api_v1_custom_chords__identifier__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_patterns_api_v1_patterns_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatternView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_pattern_api_v1_patterns_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatternInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatternView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_pattern_api_v1_patterns__identifier__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatternInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatternView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_pattern_api_v1_patterns__identifier__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    favorite_pattern_api_v1_patterns__identifier__favorite_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    unfavorite_pattern_api_v1_patterns__identifier__favorite_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    managed_patterns_api_v1_managed_patterns_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatternView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_shared_api_v1_managed_patterns_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SharedPatternInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatternView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_shared_api_v1_managed_patterns__identifier__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SharedPatternInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatternView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    archive_shared_api_v1_managed_patterns__identifier__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    list_songs_api_v1_songs_get: {
        parameters: {
            query?: {
                q?: string;
                language?: ("en" | "ur" | "hi") | null;
                artist?: string;
                difficulty?: ("beginner" | "intermediate" | "advanced") | null;
                instrument?: ("guitar" | "bass" | "ukulele") | null;
                genre?: string;
                availability?: ("arrangement" | "lyrics") | null;
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SongPage"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    song_api_v1_songs__identifier__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SongDetail"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    stage_import_api_v1_song_imports_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ImportInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImportView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    preview_import_api_v1_song_imports__identifier__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImportView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    commit_import_api_v1_song_imports__identifier__commit_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ImportView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    withdraw_song_api_v1_managed_songs__identifier__withdraw_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Withdrawal"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    active_api_v1_practice_current_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionView"] | null;
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    history_api_v1_practice_sessions_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    start_api_v1_practice_sessions_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionStart"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    command_api_v1_practice_sessions__identifier___action__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
                action: "pause" | "resume" | "end" | "save";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Command"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_session_api_v1_practice_sessions__identifier__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_session_api_v1_practice_sessions__identifier__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_session_api_v1_practice_sessions__identifier__delete: {
        parameters: {
            query: {
                version: number;
            };
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    routines_api_v1_practice_routines_get: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoutineView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    create_routine_api_v1_practice_routines_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RoutineCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoutineView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    get_routine_api_v1_practice_routines__identifier__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoutineView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    update_routine_api_v1_practice_routines__identifier__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RoutineUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoutineView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    delete_routine_api_v1_practice_routines__identifier__delete: {
        parameters: {
            query: {
                version: number;
            };
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    duplicate_routine_api_v1_practice_routines__identifier__duplicate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                identifier: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Duplicate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RoutineView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    goals_api_v1_practice_goals_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalView"][];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    goal_api_v1_practice_goals__period__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                period: "daily" | "weekly";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GoalInput"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GoalView"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    live_api_v1_health_live_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    ready_api_v1_health_ready_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
            /** @description Unprocessable Content */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Internal Server Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Service Unavailable */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}
