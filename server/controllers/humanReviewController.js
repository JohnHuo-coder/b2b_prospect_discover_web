

const humanReviewController = {
    async updateEmailClassificationStatus(req, res){
        try {
            const { id } = req.params.id;
            const result = await humanReviewRepository.updateEmailClassificationStatus({
              id
            });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Email classification not found' });
            }
            res.json({ message: 'Email classification status updated successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateComplianceCheckStatus(req, res){
        try {
            const { id } = req.params.id;
            const result = await humanReviewRepository.updateComplianceCheckStatus({
              id
            });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Compliance check record not found' });
            }
            res.json({ message: 'Compliance check status updated successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}