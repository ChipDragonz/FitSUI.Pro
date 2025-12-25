module fitsui::game {
    use std::string::{Self, String};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use sui::dynamic_object_field as ofield; 

    // --- CÁC MÃ LỖI ---
    const E_NO_STAMINA: u64 = 2;
    const E_MINT_COOLDOWN: u64 = 4;
    const E_NOT_FUSIBLE: u64 = 5; 
    #[allow(unused_const)]
    const E_SLOT_OCCUPIED: u64 = 6; 

    // --- CẤU HÌNH HỆ THỐNG ---
    const MINT_COOLDOWN_MS: u64 = 60000; 
    const STAMINA_REGEN_MS: u64 = 60000; 
    const BASE_MAX_STAMINA: u64 = 100;

    // --- CHỈ SỐ SỨC MẠNH CỐ ĐỊNH ---
    const BONUS_COMMON: u64 = 2;    
    const BONUS_RARE: u64 = 3;      
    const BONUS_EPIC: u64 = 5;      
    const BONUS_LEGENDARY: u64 = 10; 

    public struct AdminCap has key { id: UID }

    public struct GameInfo has key {
        id: UID, admin: address, xp_per_workout: u64, level_threshold: u64,
        default_url: String, cooldown_ms: u64, minters: Table<address, u64>, 
        hero_count: u64, item_count: u64, 
    }

    public struct Hero has key, store {
        id: UID, name: String, level: u64, xp: u64, url: String,
        stamina: u64, strength: u64, element: u8, 
        last_update_timestamp: u64, number: u64, 
    }

    public struct Item has key, store {
        id: UID, name: String, part: u8, rarity: u8, bonus: u64, url: String, 
    }

    // --- EVENTS ---
    public struct HeroCreated has copy, drop { id: ID, owner: address, name: String, element: u8, number: u64 }
    public struct WorkoutCompleted has copy, drop { id: ID, owner: address, new_xp: u64, new_stamina: u64 }
    public struct HeroLeveledUp has copy, drop { id: ID, owner: address, new_level: u64 }
    public struct HeroFused has copy, drop { id: ID, owner: address, new_level: u64 }
    public struct ItemDropped has copy, drop { 
        hero_id: ID, item_id: ID, owner: address, rarity: u8, name: String, url: String 
    }
    public struct MonsterSlain has copy, drop { id: ID, monster_hp: u64, stamina_spent: u64 }

    fun init(ctx: &mut TxContext) {
        let sender = ctx.sender();
        transfer::transfer(AdminCap { id: object::new(ctx) }, sender);
        
        transfer::share_object(GameInfo {
            id: object::new(ctx), admin: sender, xp_per_workout: 10, 
            level_threshold: 100, 
            default_url: string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreihflrgixxfqxqb5s22kl47ausqu3ruigpx6izhynbg6ewbrjs4ti4"),
            cooldown_ms: 5000, minters: table::new(ctx), hero_count: 0, item_count: 0, 
        });
    }

    // --- HELPERS ---
    fun u64_to_string(mut n: u64): String {
        if (n == 0) return string::utf8(b"0");
        let mut res = vector::empty<u8>();
        while (n > 0) {
            vector::push_back(&mut res, ((48 + (n % 10)) as u8));
            n = n / 10;
        };
        vector::reverse(&mut res);
        string::utf8(res)
    }

    fun get_max_stamina(level: u64): u64 {
        BASE_MAX_STAMINA + (level * 15)
    }

    fun get_next_level_threshold(level: u64, base_threshold: u64): u64 {
        let next_lv = level + 1;
        next_lv * next_lv * next_lv * base_threshold 
    }

    // ✅ CẬP NHẬT TÊN TIẾNG ANH THEO YÊU CẦU
    fun get_item_metadata(part: u8, rarity: u8): (String, String) {
        if (part == 0) { // Shield
            if (rarity == 0) (string::utf8(b"Common Shield"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreiabacwauy5j3imqr3cgivzfwav7by24uxbzvaln7ha3pdvpqy54zm"))
            else if (rarity == 1) (string::utf8(b"Rare Shield"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreihq5a3pkroc2czyd44bpo4kmwizjtncyogkkc4fyspabjnqctdlzm"))
            else if (rarity == 2) (string::utf8(b"Epic Shield"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreihxh5nkp5n2le6m3fq6ftjf2d7fl4dcpukjqakj2gzwip6o7d7jiq"))
            else (string::utf8(b"Legendary Shield"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreicbpz5ef5fqwflheailtjrp2hsqicjnn4mh3yv7cbs4jgmkptlove"))
        } else if (part == 1) { // Cloak
            if (rarity == 0) (string::utf8(b"Common Cloak"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreic6zofhkfiuz7wt2crbfmlchrq5bc3gkxiu6kn4sc5dthgofgaoni"))
            else if (rarity == 1) (string::utf8(b"Rare Cloak"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreibafxvmyg6c6ywsc4z2rlyy5cuikmgvmp35evlnpyum5hmpw22nhq"))
            else if (rarity == 2) (string::utf8(b"Epic Cloak"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreiegcnvwlvrinn2ajmrjtjedtwowsdcmpmqbbvgnwxt63bcwggm5yi"))
            else (string::utf8(b"Legendary Cloak"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreigbxpna64gxe6vy5mg7m6fhd4d33777hkb3n24lsvpgqrmj4ixctm"))
        } else if (part == 2) { // Pants
            if (rarity == 0) (string::utf8(b"Common Pants"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreifewpyjumnm3brkgqyuc2mpgtxob47vwmyysfc42c3yuc5b6bqzha"))
            else if (rarity == 1) (string::utf8(b"Rare Pants"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreid3ao224kchr5cf65pvsagktrcr3s4iwyldqeo5jywzd5jcjrdujy"))
            else if (rarity == 2) (string::utf8(b"Epic Pants"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreihqa2thlpzyopj6icgqvxngighvofq4s6x2zj4o7rstnid7eygkra"))
            else (string::utf8(b"Legendary Pants"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreihqsg3iqb6tbm46cvnonfwjlmxuxhvanmjidhzlsfbokruxvvqccm"))
        } else if (part == 3) { // Shirt
            if (rarity == 0) (string::utf8(b"Common Shirt"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreih7vgmfrqybxiz5ivmnzll4tc5anpr7oudd7heovhptojnyvh5f3q"))
            else if (rarity == 1) (string::utf8(b"Rare Shirt"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreiazmxfakhtipk57tuoi2zeoiw7uhnoqkclnhakmrgwuvhujtqxwxe"))
            else if (rarity == 2) (string::utf8(b"Epic Shirt"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreigs4ebl2cvfjpqwbktnkwq57gtog2yedmzrtkyabik7twwgqkd2le"))
            else (string::utf8(b"Legendary Shirt"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreib4htwqjtl4d2blrklywjeqq4n5jboemmorfsiyvsx3hu5mavpa7m"))
        } else if (part == 4) { // Gloves
            if (rarity == 0) (string::utf8(b"Common Gloves"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreifdmmrcmswop57enkqw2ye4gi4n3s7ct4xntmcthc6m7kaxkn5r2u"))
            else if (rarity == 1) (string::utf8(b"Rare Gloves"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreif6h3hydfkhbeuhq2eglnm3zuga3pgblrwdprvdr3eugceuoutavq"))
            else if (rarity == 2) (string::utf8(b"Epic Gloves"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreih3cultas33flcwkmw2srb6illntuckftoz4f6j47wa74j62rp3im"))
            else (string::utf8(b"Legendary Gloves"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreidxvoipb2hn7yxi3wguslpvqgxeva5zhad5hgffnzttbx6zmnbgfq"))
        } else if (part == 5) { // Necklace
            if (rarity == 0) (string::utf8(b"Common Necklace"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreigz6g5ptw6q5fhof6de5myzfazwpkymqr442tgfpcdj2wa4bwqme4"))
            else if (rarity == 1) (string::utf8(b"Rare Necklace"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreidgcql3xhwqo2h3yeddjj66txbt4hr2ebqnapnqwt7t7cld7k5jqq"))
            else if (rarity == 2) (string::utf8(b"Epic Necklace"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreifaniu3pp2islunf7v2dt27yozciexbjodluruvo3ou3dkwlkxblm"))
            else (string::utf8(b"Legendary Necklace"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreia4pmmkytcrrlhgrmexzvpdlcubx6zbtifg2qeot5hkoriit2wt6q"))
        } else { // part == 6 (Sword)
            if (rarity == 0) (string::utf8(b"Common Sword"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreiak7amifcswqsoenjdcjf7nof5da5t6x6k5pwor2v5iwbtvhftcdy"))
            else if (rarity == 1) (string::utf8(b"Rare Sword"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreidsdlhfcxhjp77xxzrcjy2o5i7js6522b7puxab4sn7vrbbol237y"))
            else if (rarity == 2) (string::utf8(b"Epic Sword"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreietubv5qa4qwgvfd4uhywxzogbhsjeaqnignygrogtc32jvtdjtcy"))
            else (string::utf8(b"Legendary Sword"), string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreiao3tgmsqevwl7swqdzywvrjja6zl6mcwojthnz5d2xh6yd2sedue"))
        }
    }

    fun get_hero_url_by_element(element: u8): String {
        if (element == 0) string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreich6qo45gjpft5gaei5x4brwbfpkzjd5v3is3nmkccdlpoplm2so4")
        else if (element == 1) string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreig2k62kms4pz3tdsr2mj477smelodlosfptqrryj5efcu3btcnlty")
        else if (element == 2) string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreic2pax6pkknyzz5zfhuokgzolxdsyck46syfcaxzt5ts76ukthwwa")
        else if (element == 3) string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreib6pmkrzfvqx2ofzmac4lqq7jjxvpg645du5xygvjrv73awimrk4e")
        else string::utf8(b"https://beige-urgent-clam-163.mypinata.cloud/ipfs/bafkreigd5ripyvsll2l5ln2ojium67gcevxi5d7gb5vrhtrenxmzy3gw5e") 
    }

    public fun get_total_strength(hero: &Hero): u64 {
        let mut total = hero.strength;
        let mut i = 0;
        while (i < 7) {
            if (i == 3) { 
                i = i + 1;
                continue
            };
            let part_label = u64_to_string(i);
            if (ofield::exists_(&hero.id, part_label)) {
                let item = ofield::borrow<String, Item>(&hero.id, part_label);
                total = total + item.bonus;
            };
            i = i + 1;
        };
        total
    }

    fun update_stamina_engine(hero: &mut Hero, clock: &Clock) {
        let current_time = clock::timestamp_ms(clock);
        let time_passed = current_time - hero.last_update_timestamp;
        let intervals = time_passed / STAMINA_REGEN_MS; 
        if (intervals > 0) {
            let mut amount_per_interval = 1; 
            let part_label = u64_to_string(3); // Giờ đây là Shirt (Áo)
            if (ofield::exists_(&hero.id, part_label)) {
                let shirt = ofield::borrow<String, Item>(&hero.id, part_label);
                amount_per_interval = amount_per_interval + shirt.bonus; 
            };
            let total_regen = intervals * amount_per_interval;
            let max_stamina = get_max_stamina(hero.level);
            hero.stamina = if (hero.stamina + total_regen > max_stamina) { max_stamina } 
                          else { hero.stamina + total_regen };
            hero.last_update_timestamp = hero.last_update_timestamp + (intervals * STAMINA_REGEN_MS);
        };
    }

    // --- CORE ENTRY FUNCTIONS ---

    public entry fun create_hero(game_info: &mut GameInfo, clock: &Clock, ctx: &mut TxContext) {
        let sender = ctx.sender();
        let current_time = clock::timestamp_ms(clock);
        if (table::contains(&game_info.minters, sender)) {
            let last_mint = *table::borrow(&game_info.minters, sender);
            assert!(current_time >= last_mint + MINT_COOLDOWN_MS, E_MINT_COOLDOWN);
            table::remove(&mut game_info.minters, sender);
        };
        table::add(&mut game_info.minters, sender, current_time);
        game_info.hero_count = game_info.hero_count + 1;
        let mut hero_name = string::utf8(b"Hero #");
        string::append(&mut hero_name, u64_to_string(game_info.hero_count));
        
        let element = ((clock::timestamp_ms(clock) % 5) as u8); 

        let hero = Hero {
            id: object::new(ctx), name: hero_name, level: 0, xp: 0, 
            url: get_hero_url_by_element(element), 
            stamina: BASE_MAX_STAMINA, strength: 1, element: element, 
            last_update_timestamp: current_time, number: game_info.hero_count,
        };
        event::emit(HeroCreated { id: object::uid_to_inner(&hero.id), owner: sender, name: hero.name, element: hero.element, number: hero.number });
        transfer::transfer(hero, sender);
    }

    public entry fun workout(hero: &mut Hero, game_info: &mut GameInfo, clock: &Clock, multiplier: u64, ctx: &mut TxContext) {
        update_stamina_engine(hero, clock);
        let stamina_needed = 10 * multiplier;
        assert!(hero.stamina >= stamina_needed, E_NO_STAMINA);
        hero.stamina = hero.stamina - stamina_needed;
        
        let total_str = get_total_strength(hero);
        let xp_gain = (total_str * 10) * multiplier; 
        hero.xp = hero.xp + xp_gain;

        let timestamp = clock::timestamp_ms(clock);
        let rarity_roll = (timestamp / 100) % 100;
        let part_roll = ((timestamp / 10000) % 7) as u8; 

        let (rarity, bonus);
        if (rarity_roll < 70) { rarity = 0; bonus = BONUS_COMMON; }
        else if (rarity_roll < 90) { rarity = 1; bonus = BONUS_RARE; }
        else if (rarity_roll < 98) { rarity = 2; bonus = BONUS_EPIC; }
        else { rarity = 3; bonus = BONUS_LEGENDARY; };

        let (final_name, item_url) = get_item_metadata(part_roll, rarity);
        
        game_info.item_count = game_info.item_count + 1;
        let item = Item {
            id: object::new(ctx), name: final_name, part: part_roll, 
            rarity: rarity, bonus: bonus, url: item_url, 
        };

        event::emit(ItemDropped { 
            hero_id: object::uid_to_inner(&hero.id), item_id: object::uid_to_inner(&item.id), 
            owner: ctx.sender(), rarity: rarity, name: final_name, url: item_url 
        });
        transfer::public_transfer(item, ctx.sender());
        event::emit(WorkoutCompleted { id: object::uid_to_inner(&hero.id), owner: ctx.sender(), new_xp: hero.xp, new_stamina: hero.stamina });
        check_level_up(hero, game_info, ctx);
    }

    public entry fun slay_monster(hero: &mut Hero, game_info: &mut GameInfo, clock: &Clock, monster_hp: u64, ctx: &mut TxContext) {
        update_stamina_engine(hero, clock);
        let strength = get_total_strength(hero);
        let hits_needed = (monster_hp + strength - 1) / strength;
        assert!(hero.stamina >= hits_needed, E_NO_STAMINA);
        hero.stamina = hero.stamina - hits_needed;
        hero.xp = hero.xp + monster_hp;

        let timestamp = clock::timestamp_ms(clock);
        let rarity_roll = (timestamp / 100) % 100;
        let part_roll = ((timestamp / 10000) % 7) as u8; 

        let (rarity, bonus);
        if (rarity_roll < 70) { rarity = 0; bonus = BONUS_COMMON; }
        else if (rarity_roll < 90) { rarity = 1; bonus = BONUS_RARE; }
        else if (rarity_roll < 98) { rarity = 2; bonus = BONUS_EPIC; }
        else { rarity = 3; bonus = BONUS_LEGENDARY; };

        let (final_name, item_url) = get_item_metadata(part_roll, rarity);
        
        game_info.item_count = game_info.item_count + 1;
        let item = Item {
            id: object::new(ctx), name: final_name, part: part_roll, 
            rarity: rarity, bonus: bonus, url: item_url, 
        };

        event::emit(ItemDropped { 
            hero_id: object::uid_to_inner(&hero.id), item_id: object::uid_to_inner(&item.id), 
            owner: ctx.sender(), rarity: rarity, name: final_name, url: item_url
        });
        transfer::public_transfer(item, ctx.sender());
        event::emit(MonsterSlain { id: object::uid_to_inner(&hero.id), monster_hp, stamina_spent: hits_needed });
        check_level_up(hero, game_info, ctx);
    }

    public entry fun equip_item(hero: &mut Hero, item: Item, ctx: &mut TxContext) {
        let part_label = u64_to_string(item.part as u64);
        if (ofield::exists_(&hero.id, part_label)) {
            let old_item: Item = ofield::remove(&mut hero.id, part_label);
            transfer::public_transfer(old_item, ctx.sender());
        };
        ofield::add(&mut hero.id, part_label, item); 
    }

    public entry fun unequip_item(hero: &mut Hero, part: u8, ctx: &mut TxContext) {
        let item: Item = ofield::remove(&mut hero.id, u64_to_string(part as u64)); 
        transfer::public_transfer(item, ctx.sender());
    }

public entry fun fuse_heroes(h1: Hero, h2: Hero, h3: Hero, game_info: &mut GameInfo, clock: &Clock, ctx: &mut TxContext) {
        assert!(h1.element == h2.element && h1.level == h2.level && h2.level == h3.level, E_NOT_FUSIBLE);
        game_info.hero_count = game_info.hero_count + 1;
        let mut fused_name = string::utf8(b"Hero #");
        string::append(&mut fused_name, u64_to_string(game_info.hero_count));
        let lv = h1.level + 2;
        let fused_hero = Hero {
            id: object::new(ctx), name: fused_name, level: lv, xp: 0, url: h1.url,
            stamina: get_max_stamina(lv), strength: lv + 1, element: h1.element,
            last_update_timestamp: clock::timestamp_ms(clock), number: game_info.hero_count,
        };
        event::emit(HeroFused { id: object::uid_to_inner(&fused_hero.id), owner: ctx.sender(), new_level: lv });

        // ✅ ĐÃ SỬA: Phải giải phóng h1, h2, h3 để xóa các Object cũ
        let Hero { id: id1, .. } = h1; 
        let Hero { id: id2, .. } = h2; // Trước đó tui viết nhầm là id2 = id2
        let Hero { id: id3, .. } = h3; // Trước đó tui viết nhầm là id3 = id3

        object::delete(id1); 
        object::delete(id2); 
        object::delete(id3);
        
        transfer::transfer(fused_hero, ctx.sender());
    }

    public entry fun equip_multiple_items(hero: &mut Hero, mut items: vector<Item>, ctx: &mut TxContext) {
        while (vector::length(&items) > 0) {
            let item = vector::remove(&mut items, 0);
            equip_item(hero, item, ctx); 
        };
        vector::destroy_empty(items);
    }

    fun check_level_up(hero: &mut Hero, game_info: &GameInfo, _ctx: &TxContext) {
        let mut threshold = get_next_level_threshold(hero.level, game_info.level_threshold);
        while (hero.xp >= threshold) {
            hero.level = hero.level + 1;
            hero.strength = hero.strength + 1;
            hero.stamina = get_max_stamina(hero.level);
            threshold = get_next_level_threshold(hero.level, game_info.level_threshold);
            event::emit(HeroLeveledUp { id: object::uid_to_inner(&hero.id), owner: _ctx.sender(), new_level: hero.level });
        }
    }
}