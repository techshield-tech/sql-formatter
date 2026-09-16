// Representative sample SQL for the "Load sample" action. Deliberately
// includes a comment and a string literal containing punctuation, so
// Format/Minify both have something interesting to demonstrate on. Tool-specific.

export const SAMPLE_SQL = `-- Top customers by total spend in the last year
select c.id, c.name, sum(o.total) as total_spent /* revenue, in cents */
from customers as c
join orders as o on o.customer_id = c.id
where o.created_at >= '2025-01-01' and o.status <> 'cancelled, refunded'
group by c.id, c.name
having sum(o.total) > 1000
order by total_spent desc
limit 20;
`;
