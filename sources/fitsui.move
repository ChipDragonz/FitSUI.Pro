module fitsui::game {
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};

    const E_NO_STAMINA: u64 = 2;
    const E_IN_COOLDOWN: u64 = 3;
    const E_MINT_COOLDOWN: u64 = 4;
    const ONE_DAY_MS: u64 = 86400000; 

    public struct AdminCap has key { id: UID }

    public struct GameInfo has key {
        id: UID,
        admin: address,
        xp_per_workout: u64,
        level_threshold: u64,
        level_urls: vector<String>,
        cooldown_ms: u64,
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

    public struct HeroCreated has copy, drop { id: ID, owner: address, name: String, element: u8 }
    public struct WorkoutCompleted has copy, drop { id: ID, owner: address, new_xp: u64, new_stamina: u64 }
    public struct HeroLeveledUp has copy, drop { id: ID, owner: address, new_level: u64, new_url: String }

    fun init(ctx: &mut TxContext) {
        let sender = ctx.sender();
        transfer::transfer(AdminCap { id: object::new(ctx) }, sender);
        let mut urls = vector::empty<String>();
        vector::push_back(&mut urls, string::utf8(b"https://i.imgur.com/Level1_Image.png")); 
        vector::push_back(&mut urls, string::utf8(b"https://i.imgur.com/Level2_Image.png"));
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

    public entry fun create_hero(name: vector<u8>, element_choice: u8, game_info: &mut GameInfo, clock: &Clock, ctx: &mut TxContext) {
        let sender = ctx.sender();
        let current_time = clock::timestamp_ms(clock);
        if (table::contains(&game_info.minters, sender)) {
            let last_mint_time = *table::borrow(&game_info.minters, sender);
            assert!(current_time >= last_mint_time + ONE_DAY_MS, E_MINT_COOLDOWN);
            *table::borrow_mut(&mut game_info.minters, sender) = current_time;
        } else {
            table::add(&mut game_info.minters, sender, current_time);
        };
        let hero = Hero {
            id: object::new(ctx),
            name: string::utf8(name),
            level: 0,
            xp: 0,
            url: *vector::borrow(&game_info.level_urls, 0),
            stamina: 100, 
            strength: 1, 
            element: element_choice, 
            last_workout_timestamp: 0,
        };
        event::emit(HeroCreated { id: object::uid_to_inner(&hero.id), owner: sender, name: hero.name, element: hero.element });
        transfer::transfer(hero, sender);
    }

    // HÀM QUAN TRỌNG: Nhận multiplier để tính tổng XP/Stamina một lần
    public entry fun workout(hero: &mut Hero, game_info: &GameInfo, clock: &Clock, multiplier: u64, ctx: &mut TxContext) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= hero.last_workout_timestamp + game_info.cooldown_ms, E_IN_COOLDOWN);
        
        let total_stamina_cost = 10 * multiplier;
        assert!(hero.stamina >= total_stamina_cost, E_NO_STAMINA);
        
        hero.stamina = hero.stamina - total_stamina_cost;
        let xp_gain = (game_info.xp_per_workout * hero.strength) * multiplier;
        hero.xp = hero.xp + xp_gain;
        hero.last_workout_timestamp = current_time;

        event::emit(WorkoutCompleted { id: object::uid_to_inner(&hero.id), owner: ctx.sender(), new_xp: hero.xp, new_stamina: hero.stamina });
        check_level_up(hero, game_info, ctx);
    }

    fun check_level_up(hero: &mut Hero, game_info: &GameInfo, ctx: &TxContext) {
        if (hero.xp >= (hero.level + 1) * game_info.level_threshold) {
            let next_level = hero.level + 1;
            if (next_level < vector::length(&game_info.level_urls)) {
                hero.level = next_level;
                hero.url = *vector::borrow(&game_info.level_urls, next_level);
                hero.strength = hero.strength + 1; 
                event::emit(HeroLeveledUp { id: object::uid_to_inner(&hero.id), owner: ctx.sender(), new_level: hero.level, new_url: hero.url });
            }
        }
    }
}