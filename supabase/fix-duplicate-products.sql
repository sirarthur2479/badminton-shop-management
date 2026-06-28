-- Delete duplicate shop_products, keeping the newest row per name
-- (the ones with images, inserted by the second schema run)
delete from shop_products
where id in (
  select id from (
    select id,
           row_number() over (partition by name order by created_at desc) as rn
    from shop_products
  ) t
  where rn > 1
);
