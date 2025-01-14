const Coupon = require('../models/Coupon');
const logger = require('../utils/logger');
const CustomError = require('../utils/customError');

class CouponService
{
    static async create(data)
    {
        try
        {
            return await Coupon.create(data);
        } catch (error)
        {
            logger.error('Error creating coupon:', error);
            throw new CustomError('Error creating coupon', 500);
        }
    }

    static async getAll()
    {
        try
        {
            return await Coupon.getAll();
        } catch (error)
        {
            logger.error('Error fetching coupons:', error);
            throw new CustomError('Error fetching coupons', 500);
        }
    }

    static async update(id, data)
    {
        try
        {
            const coupon = await Coupon.findById(id);
            if (!coupon)
            {
                throw new CustomError("Coupon not found", 404);
            }

            return await Coupon.update(id, data);
        } catch (error)
        {
            logger.error('Error updating coupon:', error);
            throw new CustomError('Error updating coupon', 500);
        }
    }

    static async delete(id)
    {
        try
        {
            const coupon = await Coupon.findById(id);
            if (!coupon)
            {
                throw new CustomError("Coupon not found", 404);
            }

            await Coupon.delete(id);
            return { message: "Coupon deleted successfully" };
        } catch (error)
        {
            logger.error('Error deleting coupon:', error);
            throw new CustomError('Error deleting coupon', 500);
        }
    }
}

module.exports = CouponService;