module fitsui::game {
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};

    // --- MÃ LỖI ---
    const E_HERO_EXIST: u64 = 1; // (Không dùng nữa nhưng cứ để)
    const E_NO_STAMINA: u64 = 2;
    const E_IN_COOLDOWN: u64 = 3;
    const E_MINT_COOLDOWN: u64 = 4; // Lỗi chưa đủ 24h

    // 1 ngày = 24 * 60 * 60 * 1000 ms
    const ONE_DAY_MS: u64 = 86400000; 

    public struct AdminCap has key { id: UID }

    public struct GameInfo has key {
        id: UID,
        admin: address,
        xp_per_workout: u64,
        level_threshold: u64,
        level_urls: vector<String>,
        cooldown_ms: u64,
        
        // 👇 THAY ĐỔI QUAN TRỌNG: Lưu thời gian (u64) thay vì bool
        minters: Table<address, u64>, 
    }

    public struct Hero has key, store {
        id: UID,
        name: String,
        level: u64,
        xp: u64,
        url: String,
        stamina: u64,
        strength: u64,
        element: u8,
        last_workout_timestamp: u64,
    }

    public struct HeroCreated has copy, drop { 
        id: ID, owner: address, name: String, element: u8 
    }
    public struct WorkoutCompleted has copy, drop { 
        id: ID, owner: address, new_xp: u64, new_stamina: u64 
    }
    public struct HeroLeveledUp has copy, drop { 
        id: ID, owner: address, new_level: u64, new_url: String 
    }

    fun init(ctx: &mut TxContext) {
        let sender = ctx.sender();
        transfer::transfer(AdminCap { id: object::new(ctx) }, sender);

        let mut urls = vector::empty<String>();
        vector::push_back(&mut urls, string::utf8(b"https://i.imgur.com/Level1_Image.png")); 
        vector::push_back(&mut urls, string::utf8(b"https://i.imgur.com/Level2_Image.png"));
        vector::push_back(&mut urls, string::utf8(b"https://i.imgur.com/Level3_Image.png"));

        transfer::share_object(GameInfo {
            id: object::new(ctx),
            admin: sender,
            xp_per_workout: 10,
            level_threshold: 50,
            level_urls: urls,
            cooldown_ms: 5000, 
            minters: table::new(ctx),
        });
    }

    // 👇 CẬP NHẬT HÀM NÀY: Thêm Clock để check thời gian
    public entry fun create_hero(
        name: vector<u8>, 
        element_choice: u8, 
        game_info: &mut GameInfo, 
        clock: &Clock, // Thêm tham số Clock
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let current_time = clock::timestamp_ms(clock);

        // LOGIC CHECK 1 NGÀY 1 HERO
        if (table::contains(&game_info.minters, sender)) {
            let last_mint_time = *table::borrow(&game_info.minters, sender);
            // Nếu chưa đủ 24h từ lần mint trước -> Báo lỗi
            assert!(current_time >= last_mint_time + ONE_DAY_MS, E_MINT_COOLDOWN);
            
            // Nếu đủ rồi -> Cập nhật thời gian mới
            *table::borrow_mut(&mut game_info.minters, sender) = current_time;
        } else {
            // Nếu chưa mint bao giờ -> Thêm vào bảng
            table::add(&mut game_info.minters, sender, current_time);
        };

        let url = *vector::borrow(&game_info.level_urls, 0);
        
        let hero = Hero {
            id: object::new(ctx),
            name: string::utf8(name),
            level: 0,
            xp: 0,
            url: url,
            stamina: 100, 
            strength: 1, 
            element: element_choice, 
            last_workout_timestamp: 0,
        };

        event::emit(HeroCreated {
            id: object::uid_to_inner(&hero.id),
            owner: sender,
            name: hero.name,
            element: hero.element,
        });

        transfer::transfer(hero, sender);
    }

    // ... (Các hàm workout, refill_stamina... GIỮ NGUYÊN KHÔNG ĐỔI) ...
    public entry fun workout(hero: &mut Hero, game_info: &GameInfo, clock: &Clock, ctx: &mut TxContext) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= hero.last_workout_timestamp + game_info.cooldown_ms, E_IN_COOLDOWN);
        assert!(hero.stamina >= 10, E_NO_STAMINA);
        hero.stamina = hero.stamina - 10;
        let xp_gain = game_info.xp_per_workout * hero.strength;
        hero.xp = hero.xp + xp_gain;
        hero.last_workout_timestamp = current_time;
        event::emit(WorkoutCompleted {
            id: object::uid_to_inner(&hero.id),
            owner: ctx.sender(),
            new_xp: hero.xp,
            new_stamina: hero.stamina, 
        });
        check_level_up(hero, game_info, ctx);
    }

    public entry fun refill_stamina(hero: &mut Hero, _ctx: &mut TxContext) {
        hero.stamina = 100;
    }

    fun check_level_up(hero: &mut Hero, game_info: &GameInfo, ctx: &TxContext) {
        if (hero.xp >= (hero.level + 1) * game_info.level_threshold) {
            let next_level = hero.level + 1;
            if (next_level < vector::length(&game_info.level_urls)) {
                hero.level = next_level;
                hero.url = *vector::borrow(&game_info.level_urls, next_level);
                hero.strength = hero.strength + 1; 
                event::emit(HeroLeveledUp {
                    id: object::uid_to_inner(&hero.id),
                    owner: ctx.sender(),
                    new_level: hero.level,
                    new_url: hero.url,
                });
            }
        }
    }
    
    public entry fun update_game_rules(_: &AdminCap, game_info: &mut GameInfo, new_xp: u64, new_threshold: u64, new_cooldown: u64) {
        game_info.xp_per_workout = new_xp;
        game_info.level_threshold = new_threshold;
        game_info.cooldown_ms = new_cooldown;
    }
}