import vine from '@vinejs/vine'

export const updateMaintenanceValidator = vine.create({
  enabled: vine.boolean().optional(),
  message: vine.string().trim().maxLength(500).optional(),
  allowedIps: vine.array(vine.string().trim().maxLength(64)).maxLength(100).optional(),
})

export const toggleMaintenanceValidator = vine.create({
  enabled: vine.boolean(),
})
