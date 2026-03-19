import { pool } from '@workspace/db';

export class StripeStorage {
  async getProduct(productId: string) {
    const result = await pool.query(
      'SELECT * FROM stripe.products WHERE id = $1',
      [productId]
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true) {
    const result = await pool.query(
      'SELECT * FROM stripe.products WHERE active = $1 ORDER BY created DESC',
      [active]
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true) {
    const result = await pool.query(`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active, images, created
        FROM stripe.products
        WHERE active = $1
        ORDER BY created DESC
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.active as product_active,
        p.metadata as product_metadata,
        p.images as product_images,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active,
        pr.metadata as price_metadata
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.created DESC, pr.unit_amount ASC
    `, [active]);
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await pool.query(
      'SELECT * FROM stripe.prices WHERE id = $1',
      [priceId]
    );
    return result.rows[0] || null;
  }

  async getSubscription(subscriptionId: string) {
    const result = await pool.query(
      'SELECT * FROM stripe.subscriptions WHERE id = $1',
      [subscriptionId]
    );
    return result.rows[0] || null;
  }

  async getCustomer(customerId: string) {
    const result = await pool.query(
      'SELECT * FROM stripe.customers WHERE id = $1',
      [customerId]
    );
    return result.rows[0] || null;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    const result = await pool.query(
      'SELECT * FROM users WHERE stripe_customer_id = $1',
      [stripeCustomerId]
    );
    return result.rows[0] || null;
  }

  async updateUserStripeInfo(userId: number, info: { stripeCustomerId?: string; stripeSubscriptionId?: string }) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (info.stripeCustomerId !== undefined) {
      fields.push(`stripe_customer_id = $${idx++}`);
      values.push(info.stripeCustomerId);
    }
    if (info.stripeSubscriptionId !== undefined) {
      fields.push(`stripe_subscription_id = $${idx++}`);
      values.push(info.stripeSubscriptionId);
    }
    if (!fields.length) return;
    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

export const stripeStorage = new StripeStorage();
